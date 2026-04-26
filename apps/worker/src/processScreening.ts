import { computeMatch, type MatchBreakdown } from "@ats/shared";
import { createLlmProvider, type LlmProvider } from "@ats/llm";
import { prisma } from "./prisma.js";
import { loadEnv } from "./env.js";
import { getLogger } from "./logger.js";

let llm: LlmProvider | undefined;
function getLlm(): LlmProvider {
  if (llm) return llm;
  const env = loadEnv();
  llm = createLlmProvider({
    provider: env.LLM_PROVIDER,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL,
    openaiBaseUrl: env.OPENAI_BASE_URL
  });
  return llm;
}

export async function processScreening(screeningId: string): Promise<MatchBreakdown> {
  const log = getLogger().child({ screeningId });
  const screening = await prisma.screening.findUnique({
    where: { id: screeningId },
    include: { job: true, candidate: true }
  });
  if (!screening) throw new Error(`Screening ${screeningId} not found`);

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
      summary = await getLlm().refineSummary({
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

    await prisma.auditLog.create({
      data: {
        action: "screening_completed",
        entityType: "screening",
        entityId: screeningId,
        metadata: {
          overallScore: breakdown.overallScore,
          recommendation: breakdown.recommendation
        }
      }
    });

    log.info(
      { score: breakdown.overallScore, recommendation: breakdown.recommendation },
      "screening_completed"
    );
    return { ...breakdown, recruiterSummary: summary };
  } catch (err) {
    const message = (err as Error).message;
    log.error({ err }, "screening_failed");
    await prisma.screening.update({
      where: { id: screeningId },
      data: { status: "failed", errorMessage: message, completedAt: new Date() }
    });
    await prisma.auditLog.create({
      data: {
        action: "screening_failed",
        entityType: "screening",
        entityId: screeningId,
        metadata: { error: message }
      }
    });
    throw err;
  }
}

export function setLlmProviderForTests(provider: LlmProvider): void {
  llm = provider;
}
