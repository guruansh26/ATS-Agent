/**
 * Tiny in-memory stand-in for the bits of PrismaClient our API touches.
 * Lets API + service tests run without a live Postgres, while still
 * exercising every code path (validation, auth, audit, error handling).
 *
 * Used only via vi.mock("../lib/prisma", ...) inside tests.
 */
import { randomUUID } from "node:crypto";

interface Job {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  experienceMin: number | null;
  experienceMax: number | null;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  rawText: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  experienceYears: number | null;
  skills: string[];
  education: string[];
  workHistory: string[];
  rawText: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Screening {
  id: string;
  jobId: string;
  candidateId: string;
  status: string;
  overallScore: number | null;
  skillMatchScore: number | null;
  experienceMatchScore: number | null;
  locationMatchScore: number | null;
  educationMatchScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  risks: string[];
  recruiterSummary: string | null;
  recommendation: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
}

const jobs = new Map<string, Job>();
const candidates = new Map<string, Candidate>();
const screenings = new Map<string, Screening>();
const auditLogs: AuditLog[] = [];

function nowDates(): Pick<Job, "createdAt" | "updatedAt"> {
  const d = new Date();
  return { createdAt: d, updatedAt: d };
}

export const inMemoryPrisma = {
  reset(): void {
    jobs.clear();
    candidates.clear();
    screenings.clear();
    auditLogs.length = 0;
  },
  $queryRaw: async (): Promise<number> => 1,
  $disconnect: async (): Promise<void> => undefined,
  job: {
    async create({ data }: { data: Partial<Job> & { title: string } }): Promise<Job> {
      const job: Job = {
        id: randomUUID(),
        title: data.title,
        company: data.company ?? null,
        location: data.location ?? null,
        experienceMin: data.experienceMin ?? null,
        experienceMax: data.experienceMax ?? null,
        skills: data.skills ?? [],
        requirements: data.requirements ?? [],
        responsibilities: data.responsibilities ?? [],
        rawText: data.rawText ?? null,
        ...nowDates()
      };
      jobs.set(job.id, job);
      return job;
    },
    async findMany({
      skip = 0,
      take = 50
    }: { skip?: number; take?: number; orderBy?: unknown }): Promise<Job[]> {
      const all = Array.from(jobs.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      return all.slice(skip, skip + take);
    },
    async findUnique({ where: { id } }: { where: { id: string } }): Promise<Job | null> {
      return jobs.get(id) ?? null;
    }
  },
  candidate: {
    async create({
      data
    }: {
      data: Partial<Candidate> & { name: string };
    }): Promise<Candidate> {
      const cand: Candidate = {
        id: randomUUID(),
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        location: data.location ?? null,
        experienceYears: data.experienceYears ?? null,
        skills: data.skills ?? [],
        education: data.education ?? [],
        workHistory: data.workHistory ?? [],
        rawText: data.rawText ?? null,
        ...nowDates()
      };
      candidates.set(cand.id, cand);
      return cand;
    },
    async findMany({
      skip = 0,
      take = 50
    }: { skip?: number; take?: number }): Promise<Candidate[]> {
      const all = Array.from(candidates.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      return all.slice(skip, skip + take);
    },
    async findUnique({
      where: { id }
    }: { where: { id: string } }): Promise<Candidate | null> {
      return candidates.get(id) ?? null;
    }
  },
  screening: {
    async create({
      data
    }: {
      data: Partial<Screening> & { jobId: string; candidateId: string };
    }): Promise<Screening> {
      const screening: Screening = {
        id: randomUUID(),
        jobId: data.jobId,
        candidateId: data.candidateId,
        status: data.status ?? "pending",
        overallScore: null,
        skillMatchScore: null,
        experienceMatchScore: null,
        locationMatchScore: null,
        educationMatchScore: null,
        matchedSkills: [],
        missingSkills: [],
        strengths: [],
        risks: [],
        recruiterSummary: null,
        recommendation: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        ...nowDates()
      };
      screenings.set(screening.id, screening);
      return screening;
    },
    async findUnique({
      where: { id },
      include
    }: {
      where: { id: string };
      include?: { job?: boolean; candidate?: boolean };
    }): Promise<unknown> {
      const s = screenings.get(id);
      if (!s) return null;
      if (!include) return s;
      return {
        ...s,
        job: include.job ? jobs.get(s.jobId) : undefined,
        candidate: include.candidate ? candidates.get(s.candidateId) : undefined
      };
    },
    async findMany({
      where
    }: {
      where: { jobId: string };
    }): Promise<Screening[]> {
      return Array.from(screenings.values())
        .filter((s) => s.jobId === where.jobId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async update({
      where: { id },
      data
    }: {
      where: { id: string };
      data: Partial<Screening>;
    }): Promise<Screening> {
      const existing = screenings.get(id);
      if (!existing) throw new Error("not found");
      const updated = { ...existing, ...data, updatedAt: new Date() } as Screening;
      screenings.set(id, updated);
      return updated;
    },
    async deleteMany(): Promise<void> {
      screenings.clear();
    }
  },
  auditLog: {
    async create({
      data
    }: {
      data: Omit<AuditLog, "id" | "createdAt">;
    }): Promise<AuditLog> {
      const log: AuditLog = {
        id: randomUUID(),
        createdAt: new Date(),
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        metadata: data.metadata
      };
      auditLogs.push(log);
      return log;
    },
    all(): AuditLog[] {
      return auditLogs.slice();
    },
    async deleteMany(): Promise<void> {
      auditLogs.length = 0;
    }
  }
};
