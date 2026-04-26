import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  let candidate: Awaited<ReturnType<typeof api.getCandidate>>;
  try {
    candidate = await api.getCandidate(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/candidates" className="text-sm text-brand-700 hover:underline">
        ← All candidates
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {candidate.name}
            </h1>
            <div className="mt-1 text-sm text-slate-500">
              {candidate.email ?? "—"} ·{" "}
              {candidate.location ?? "Location not provided"} ·{" "}
              {candidate.experienceYears != null
                ? `${candidate.experienceYears} years`
                : "Experience unknown"}
            </div>
          </div>
          <Link
            href={`/screenings/new?candidateId=${candidate.id}`}
            className="btn-primary"
          >
            Screen for a role
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((s) => (
                <span key={s} className="badge bg-slate-100 text-slate-700">
                  {s}
                </span>
              ))}
            </div>
          </Section>
          <Section title="Education">
            <ul className="text-sm text-slate-700 space-y-1">
              {candidate.education.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Section>
          <Section title="Work history">
            <ul className="text-sm text-slate-700 space-y-1">
              {candidate.workHistory.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Section>
        </div>
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
