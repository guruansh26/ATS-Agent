import type { CreateJobInput } from "@ats/shared";
import { uniqueSkills } from "@ats/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { getLlmProvider } from "../lib/llm.js";
import { recordAudit } from "./auditService.js";

export async function createJob(input: CreateJobInput) {
  let title = input.title?.trim() || "";
  let company = input.company;
  let location = input.location;
  let experienceMin = input.experienceMin;
  let experienceMax = input.experienceMax;
  let skills = uniqueSkills(input.skills ?? []);
  let requirements = input.requirements ?? [];
  let responsibilities = input.responsibilities ?? [];

  if (input.rawText && (!title || skills.length === 0)) {
    const extracted = await getLlmProvider().extractJob(input.rawText);
    title = title || extracted.title;
    company = company ?? extracted.company;
    location = location ?? extracted.location;
    experienceMin = experienceMin ?? extracted.experienceMin;
    experienceMax = experienceMax ?? extracted.experienceMax;
    skills = uniqueSkills([...skills, ...(extracted.skills ?? [])]);
    if (requirements.length === 0) requirements = extracted.requirements ?? [];
    if (responsibilities.length === 0)
      responsibilities = extracted.responsibilities ?? [];
  }

  if (!title) {
    throw new ValidationError(
      "Job title could not be determined from the provided input"
    );
  }

  const job = await prisma.job.create({
    data: {
      title,
      company,
      location,
      experienceMin,
      experienceMax,
      skills,
      requirements,
      responsibilities,
      rawText: input.rawText
    }
  });

  await recordAudit({
    action: "job_created",
    entityType: "job",
    entityId: job.id,
    metadata: { title: job.title, skillCount: job.skills.length }
  });

  return job;
}

export async function listJobs(skip: number, take: number) {
  return prisma.job.findMany({ orderBy: { createdAt: "desc" }, skip, take });
}

export async function getJob(id: string) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new NotFoundError(`Job ${id} not found`);
  return job;
}
