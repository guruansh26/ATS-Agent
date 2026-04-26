import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  let stats = { jobs: 0, candidates: 0 };
  try {
    const [jobs, candidates] = await Promise.all([
      api.listJobs(),
      api.listCandidates()
    ]);
    stats = { jobs: jobs.count, candidates: candidates.count };
  } catch {
    // Backend may not be up yet; the dashboard still renders.
  }

  return (
    <div className="space-y-8">
      <section className="card p-8">
        <div className="text-xs uppercase tracking-wide text-brand-700 font-semibold">
          Recruiter dashboard
        </div>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          AI-powered candidate screening
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Paste a job description, drop in a resume, and get a recruiter-ready
          match: score breakdown, missing skills, strengths, risks, and a final
          recommendation. Backed by deterministic scoring and an optional LLM
          explanation layer.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/jobs/new" className="btn-primary">
            Create a job
          </Link>
          <Link href="/candidates/new" className="btn-secondary">
            Add a candidate
          </Link>
          <Link href="/screenings/new" className="btn-secondary">
            Run a screening
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Jobs" value={stats.jobs} href="/jobs" />
        <StatCard label="Candidates" value={stats.candidates} href="/candidates" />
        <StatCard label="LLM provider" value="Pluggable" href="/" sub="mock or openai" />
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900">How matching works</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-600 list-decimal list-inside">
          <li>
            Deterministic scoring weighs skills (50%), experience (25%),
            education (15%) and location (10%).
          </li>
          <li>
            Skills are normalised — <code>TS</code> matches <code>TypeScript</code>,{" "}
            <code>node js</code> matches <code>Node.js</code>, etc.
          </li>
          <li>
            The LLM only writes the recruiter-friendly summary. It cannot raise
            or lower the score.
          </li>
          <li>
            Screenings run async on a BullMQ queue so the UI stays responsive
            even at recruiter-scale volume.
          </li>
        </ol>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  sub
}: {
  label: string;
  value: string | number;
  href: string;
  sub?: string;
}): JSX.Element {
  return (
    <Link
      href={href}
      className="card p-5 hover:shadow-md transition-shadow"
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
    </Link>
  );
}
