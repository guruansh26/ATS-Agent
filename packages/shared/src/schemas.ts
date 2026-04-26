import { z } from "zod";

/**
 * Treat empty strings as omitted. Forms commonly post `""` for optional fields,
 * and we don't want that to trip Zod's `min(1)` constraint.
 */
const optStr = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(max).optional()
  );

const optTitle = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(2).max(200).optional()
);

export const createJobSchema = z
  .object({
    title: optTitle,
    company: optStr(200),
    location: optStr(200),
    experienceMin: z.number().int().min(0).max(60).optional(),
    experienceMax: z.number().int().min(0).max(60).optional(),
    skills: z.array(z.string().min(1).max(80)).max(60).default([]),
    requirements: z.array(z.string().min(1).max(500)).max(40).default([]),
    responsibilities: z.array(z.string().min(1).max(500)).max(40).default([]),
    rawText: optStr(20000)
  })
  .refine((v) => Boolean(v.title) || Boolean(v.rawText), {
    message: "Either title or rawText is required",
    path: ["title"]
  });
export type CreateJobInput = z.infer<typeof createJobSchema>;

export const createCandidateSchema = z
  .object({
    name: optTitle,
    email: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().email().optional()
    ),
    phone: optStr(40),
    location: optStr(200),
    experienceYears: z.number().min(0).max(60).optional(),
    skills: z.array(z.string().min(1).max(80)).max(80).default([]),
    education: z.array(z.string().min(1).max(300)).max(20).default([]),
    workHistory: z.array(z.string().min(1).max(500)).max(40).default([]),
    rawText: optStr(40000)
  })
  .refine((v) => Boolean(v.name) || Boolean(v.rawText), {
    message: "Either name or rawText is required",
    path: ["name"]
  });
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;

export const createScreeningSchema = z.object({
  jobId: z.string().min(1),
  candidateId: z.string().min(1)
});
export type CreateScreeningInput = z.infer<typeof createScreeningSchema>;

export const listQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0)
});
