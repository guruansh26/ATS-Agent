import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CandidatesPage(): Promise<JSX.Element> {
  let items: Awaited<ReturnType<typeof api.listCandidates>>["items"] = [];
  let error: string | null = null;
  try {
    const res = await api.listCandidates();
    items = res.items;
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Candidates</h1>
          <p className="text-sm text-slate-500">
            People you've added to the talent pool.
          </p>
        </div>
        <Link href="/candidates/new" className="btn-primary">
          + Add candidate
        </Link>
      </div>

      {error ? (
        <div className="card p-4 text-sm text-rose-700 bg-rose-50">
          Failed to load candidates: {error}
        </div>
      ) : null}

      {items.length === 0 && !error ? (
        <div className="card p-8 text-center text-slate-600">
          No candidates yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => (
            <Link key={c.id} href={`/candidates/${c.id}`} className="card p-5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{c.name}</div>
                {c.experienceYears != null ? (
                  <span className="text-xs text-slate-500">
                    {c.experienceYears} yrs
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {c.email ?? "—"} · {c.location ?? "Anywhere"}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.skills.slice(0, 6).map((s) => (
                  <span key={s} className="badge bg-slate-100 text-slate-700">
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
