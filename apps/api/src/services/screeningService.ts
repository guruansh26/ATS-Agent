import { computeMatch, type MatchBreakdown } from "@ats/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { enqueueScreening } from "../lib/queue.js";
import { getLogger } from "../lib/logger.js";
import { getLlmProvider } from "../lib/llm.js";
import { recordAudit } from "./auditService.js";

export async function requestScreening(jobId: string, candidateId: string) {
  const [job, candidate] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.candidate.findUnique({ where: { id: candidateId } })
  ]);
  if (!job) throw new NotFoundError(`Job ${jobId} not found`);
  if (!candidate) throw new NotFoundError(`Candidate ${candidateId} not found`);

  const screening = await prisma.screening.create({
    data: { jobId, candidateId, status: "pending" }
  });

  await recordAudit({
    action: "screening_requested",
    entityType: "screening",
    entityId: screening.id,
    metadata: { jobId, candidateId }
  });

  try {
    await enqueueScreening(screening.id);
  } catch (err) {
    await prisma.screening.update({
      where: { id: screening.id },
      data: { status: "failed", errorMessage: (err as Error).message }
    });
    throw err;
  }
  return screening;
}

export async function getScreening(id: string) {
  const screening = await prisma.screening.findUnique({
    where: { id },
    include: { job: true, candidate: true }
  });
  if (!screening) throw new NotFoundError(`Screening ${id} not found`);
  return screening;
}

export async function listScreeningsForJob(jobId: string) {
  return prisma.screening.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: { candidate: true }
  });
}

/**
 * Performs the actual matching: deterministic scoring first, optional LLM polish.
 * Used by the worker, but also by API tests so we don't need Redis to assert
 * the matching behaviour end-to-end.
 */
export async function performScreening(screeningId: string): Promise<MatchBreakdown> {
  const log = getLogger().child({ screeningId });
  const screening = await prisma.screening.findUnique({
    where: { id: screeningId },
    include: { job: true, candidate: true }
  });
  if (!screening) throw new NotFoundError(`Screening ${screeningId} not found`);

  await prisma.screening.update({
    where: { id: screeningId },
    data: { status: "processing", startedAt: new Date() }
  });

  try {
    const breakdown = computeMatch(
      {
        title: screening.job.title,
        location: screening.job.location,
        experienceMin: screening.job.experienceMin,
        experienceMax: screening.job.experienceMax,
        skills: screening.job.skills,
        requirements: screening.job.requirements
      },
      {
        name: screening.candidate.name,
        location: screening.candidate.location,
        experienceYears: screening.candidate.experienceYears,
        skills: screening.candidate.skills,
        education: screening.candidate.education,
        workHistory: screening.candidate.workHistory
      }
    );

    let summary = breakdown.recruiterSummary;
    try {
      summary = await getLlmProvider().refineSummary({
        breakdown,
        candidateName: screening.candidate.name,
        jobTitle: screening.job.title
      });
    } catch (err) {
      log.warn({ err }, "llm_refine_failed_falling_back_to_deterministic_summary");
    }

    await prisma.screening.update({
      where: { id: screeningId },
      data: {
        status: "completed",
        completedAt: new Date(),
        overallScore: breakdown.overallScore,
        skillMatchScore: breakdown.skillMatchScore,
        experienceMatchScore: breakdown.experienceMatchScore,
        locationMatchScore: breakdown.locationMatchScore,
        educationMatchScore: breakdown.educationMatchScore,
        matchedSkills: breakdown.matchedSkills,
        missingSkills: breakdown.missingSkills,
        strengths: breakdown.strengths,
        risks: breakdown.risks,
        recruiterSummary: summary,
        recommendation: breakdown.recommendation
      }
    });

    log.info(
      {
        score: breakdown.overallScore,
        recommendation: breakdown.recommendation,
        provider: getLlmProvider().name
      },
      "screening_completed"
    );

    await recordAudit({
      action: "screening_completed",
      entityType: "screening",
      entityId: screeningId,
      metadata: {
        overallScore: breakdown.overallScore,
        recommendation: breakdown.recommendation
      }
    });

    return { ...breakdown, recruiterSummary: summary };
  } catch (err) {
    const message = (err as Error).message;
    log.error({ err }, "screening_failed");
    await prisma.screening.update({
      where: { id: screeningId },
      data: { status: "failed", errorMessage: message, completedAt: new Date() }
    });
    await recordAudit({
      action: "screening_failed",
      entityType: "screening",
      entityId: screeningId,
      metadata: { error: message }
    });
    throw err;
  }
}
