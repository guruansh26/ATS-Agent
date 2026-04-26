const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";
const API_KEY =
  process.env.NEXT_PUBLIC_API_KEY ?? process.env.API_KEY ?? "dev-recruiter-key";

export interface Job {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  experienceYears?: number | null;
  skills: string[];
  education: string[];
  workHistory: string[];
  createdAt: string;
}

export type Recommendation = "strong_match" | "possible_match" | "weak_match";
export type ScreeningStatus = "pending" | "processing" | "completed" | "failed";

export interface Screening {
  id: string;
  jobId: string;
  candidateId: string;
  status: ScreeningStatus;
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
  recommendation: Recommendation | null;
  errorMessage: string | null;
  createdAt: string;
  job?: Job;
  candidate?: Candidate;
}

export interface ApiList<T> {
  items: T[];
  count: number;
}

interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  cache: RequestCache = "no-store"
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache,
    headers: {
      "x-api-key": API_KEY,
      "content-type": "application/json",
      ...(init.headers as Record<string, string> | undefined)
    }
  });
  if (!res.ok) {
    let body: ApiError | undefined;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // ignore
    }
    const message = body?.error?.message ?? `Request failed with ${res.status}`;
    const error = new Error(message) as Error & { status?: number; details?: unknown };
    error.status = res.status;
    error.details = body?.error?.details;
    throw error;
  }
  return (await res.json()) as T;
}

export const api = {
  listJobs: () => request<ApiList<Job>>("/api/jobs"),
  getJob: (id: string) => request<Job>(`/api/jobs/${id}`),
  createJob: (input: Partial<Job> & { title: string; rawText?: string }) =>
    request<Job>("/api/jobs", { method: "POST", body: JSON.stringify(input) }),
  jobScreenings: (id: string) =>
    request<ApiList<Screening>>(`/api/jobs/${id}/screenings`),

  listCandidates: () => request<ApiList<Candidate>>("/api/candidates"),
  getCandidate: (id: string) => request<Candidate>(`/api/candidates/${id}`),
  createCandidate: (input: Partial<Candidate> & { name: string; rawText?: string }) =>
    request<Candidate>("/api/candidates", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  createScreening: (jobId: string, candidateId: string) =>
    request<Screening>("/api/screenings", {
      method: "POST",
      body: JSON.stringify({ jobId, candidateId })
    }),
  getScreening: (id: string) => request<Screening>(`/api/screenings/${id}`)
};
