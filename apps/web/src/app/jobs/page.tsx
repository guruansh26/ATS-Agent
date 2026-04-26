import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function JobsPage(): Promise<JSX.Element> {
  let jobs: Awaited<ReturnType<typeof api.listJobs>>["items"] = [];
  let error: string | null = null;
  try {
    const res = await api.listJobs();
    jobs = res.items;
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
          <p className="text-sm text-slate-500">
            Open roles you can screen candidates against.
          </p>
        </div>
        <Link href="/jobs/new" className="btn-primary">
          + New job
        </Link>
      </div>

      {error ? (
        <div className="card p-4 text-sm text-rose-700 bg-rose-50">
          Failed to load jobs: {error}
        </div>
      ) : null}

      {jobs.length === 0 && !error ? (
        <div className="card p-8 text-center text-slate-600">
          No jobs yet. Create your first one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="card p-5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{j.title}</div>
                {j.company ? (
                  <div className="text-xs text-slate-500">{j.company}</div>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {j.location ?? "Location flexible"} ·{" "}
                {j.experienceMin != null
                  ? `${j.experienceMin}-${j.experienceMax ?? "+"} yrs`
                  : "Any experience"}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {j.skills.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="badge bg-brand-50 text-brand-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
