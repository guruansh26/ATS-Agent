import type { CreateCandidateInput } from "@ats/shared";
import { uniqueSkills } from "@ats/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { getLlmProvider } from "../lib/llm.js";
import { recordAudit } from "./auditService.js";

export async function createCandidate(input: CreateCandidateInput) {
  let name = input.name?.trim() || "";
  let email = input.email;
  let phone = input.phone;
  let location = input.location;
  let experienceYears = input.experienceYears;
  let skills = uniqueSkills(input.skills ?? []);
  let education = input.education ?? [];
  let workHistory = input.workHistory ?? [];

  if (input.rawText && (!name || skills.length === 0)) {
    const extracted = await getLlmProvider().extractResume(input.rawText);
    name = name || extracted.name;
    email = email ?? extracted.email;
    phone = phone ?? extracted.phone;
    location = location ?? extracted.location;
    experienceYears = experienceYears ?? extracted.experienceYears;
    skills = uniqueSkills([...skills, ...(extracted.skills ?? [])]);
    if (education.length === 0) education = extracted.education ?? [];
    if (workHistory.length === 0) workHistory = extracted.workHistory ?? [];
  }

  if (!name) {
    throw new ValidationError(
      "Candidate name could not be determined from the provided input"
    );
  }

  const candidate = await prisma.candidate.create({
    data: {
      name,
      email,
      phone,
      location,
      experienceYears,
      skills,
      education,
      workHistory,
      rawText: input.rawText
    }
  });

  await recordAudit({
    action: "candidate_created",
    entityType: "candidate",
    entityId: candidate.id,
    metadata: { name: candidate.name, skillCount: candidate.skills.length }
  });

  return candidate;
}

export async function listCandidates(skip: number, take: number) {
  return prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take
  });
}

export async function getCandidate(id: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) throw new NotFoundError(`Candidate ${id} not found`);
  return candidate;
}
