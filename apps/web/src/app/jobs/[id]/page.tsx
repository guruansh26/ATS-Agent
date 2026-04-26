import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { RecommendationBadge, StatusBadge } from "@/components/RecommendationBadge";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  let job: Awaited<ReturnType<typeof api.getJob>>;
  let screenings: Awaited<ReturnType<typeof api.jobScreenings>>["items"] = [];
  try {
    job = await api.getJob(params.id);
  } catch {
    notFound();
  }
  try {
    const res = await api.jobScreenings(params.id);
    screenings = res.items;
  } catch {
    // surface empty list if not authorised yet
  }

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="text-sm text-brand-700 hover:underline">
        ← All jobs
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
            <div className="mt-1 text-sm text-slate-500">
              {job.company ?? "—"} · {job.location ?? "Anywhere"} ·{" "}
              {job.experienceMin != null
                ? `${job.experienceMin}-${job.experienceMax ?? "+"} yrs`
                : "Any experience"}
            </div>
          </div>
          <Link
            href={`/screenings/new?jobId=${job.id}`}
            className="btn-primary"
          >
            Screen a candidate
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section title="Required skills">
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <span key={s} className="badge bg-brand-50 text-brand-700">
                  {s}
                </span>
              ))}
              {job.skills.length === 0 ? (
                <span className="text-sm text-slate-500">None specified</span>
              ) : null}
            </div>
          </Section>
          <Section title="Requirements">
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {job.requirements.length ? (
                job.requirements.map((r) => <li key={r}>{r}</li>)
              ) : (
                <li className="text-slate-500 list-none">None specified</li>
              )}
            </ul>
          </Section>
          <Section title="Responsibilities">
            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
              {job.responsibilities.length ? (
                job.responsibilities.map((r) => <li key={r}>{r}</li>)
              ) : (
                <li className="text-slate-500 list-none">None specified</li>
              )}
            </ul>
          </Section>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900">Screenings</h2>
        {screenings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No screenings yet for this role.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {screenings.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link
                    href={`/screenings/${s.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {s.candidate?.name ?? s.candidateId}
                  </Link>
                  <div className="text-xs text-slate-500">
                    Score: {s.overallScore == null ? "—" : `${s.overallScore}/100`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={s.status} />
                  <RecommendationBadge value={s.recommendation} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}
