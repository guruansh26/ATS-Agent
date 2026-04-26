"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, type Candidate, type Job } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function NewScreeningPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="card p-6 text-slate-600">Loading screening form…</div>
      }
    >
      <NewScreeningForm />
    </Suspense>
  );
}

function NewScreeningForm(): JSX.Element {
  const router = useRouter();
  const search = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobId, setJobId] = useState<string>(search.get("jobId") ?? "");
  const [candidateId, setCandidateId] = useState<string>(
    search.get("candidateId") ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listJobs(), api.listCandidates()])
      .then(([j, c]) => {
        setJobs(j.items);
        setCandidates(c.items);
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId || !candidateId) {
      setError("Pick a job and a candidate.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const screening = await api.createScreening(jobId, candidateId);
      router.push(`/screenings/${screening.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Run a screening</h1>
      <p className="text-sm text-slate-500 mb-6">
        Pick one of your jobs and a candidate. The match runs asynchronously
        on the worker queue and the result will appear here.
      </p>

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Job</label>
          <select
            className="input"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          >
            <option value="">Select a job…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} {j.company ? `· ${j.company}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Candidate</label>
          <select
            className="input"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
          >
            <option value="">Select a candidate…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.location ? `· ${c.location}` : ""}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">
            {error}
          </div>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Queuing screening..." : "Run screening"}
        </button>
      </form>
    </div>
  );
}
