"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Screening } from "@/lib/api";
import { ScoreBar } from "@/components/ScoreBar";
import {
  RecommendationBadge,
  StatusBadge
} from "@/components/RecommendationBadge";

export default function ScreeningDetailPage({
  params
}: {
  params: { id: string };
}): JSX.Element {
  const [screening, setScreening] = useState<Screening | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const s = await api.getScreening(params.id);
        if (!alive) return;
        setScreening(s);
        if (s.status === "pending" || s.status === "processing") {
          timer = setTimeout(tick, 1500);
        }
      } catch (err) {
        if (alive) setError((err as Error).message);
      }
    }

    void tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [params.id]);

  if (error) {
    return <div className="card p-6 text-rose-700">Failed to load: {error}</div>;
  }
  if (!screening) {
    return (
      <div className="card p-6 text-slate-600">Loading screening result…</div>
    );
  }

  const isDone = screening.status === "completed";
  const isFailed = screening.status === "failed";

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="text-sm text-brand-700 hover:underline">
        ← Back to jobs
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Screening
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mt-1">
              {screening.candidate?.name ?? screening.candidateId}
              <span className="text-slate-400"> × </span>
              {screening.job?.title ?? screening.jobId}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge value={screening.status} />
              <RecommendationBadge value={screening.recommendation} />
              {screening.overallScore != null ? (
                <span className="text-sm text-slate-500">
                  Overall {screening.overallScore}/100
                </span>
              ) : null}
            </div>
          </div>
          {isDone ? null : !isFailed ? (
            <div className="text-sm text-slate-500">
              Refreshing automatically…
            </div>
          ) : null}
        </div>
      </div>

      {isFailed ? (
        <div className="card p-6 text-rose-700">
          Screening failed: {screening.errorMessage ?? "Unknown error"}
        </div>
      ) : null}

      {isDone ? (
        <>
          <div className="card p-6 space-y-3">
            <h2 className="font-semibold text-slate-900">Score breakdown</h2>
            <ScoreBar label="Skills (50%)" value={screening.skillMatchScore} />
            <ScoreBar
              label="Experience (25%)"
              value={screening.experienceMatchScore}
            />
            <ScoreBar
              label="Education (15%)"
              value={screening.educationMatchScore}
            />
            <ScoreBar
              label="Location (10%)"
              value={screening.locationMatchScore}
            />
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-900">Recruiter summary</h2>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
              {screening.recruiterSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Matched skills" tone="emerald">
              <Tags items={screening.matchedSkills} tone="emerald" />
            </Card>
            <Card title="Missing skills" tone="rose">
              <Tags items={screening.missingSkills} tone="rose" />
            </Card>
            <Card title="Strengths" tone="emerald">
              <Bullets items={screening.strengths} />
            </Card>
            <Card title="Risks" tone="amber">
              <Bullets items={screening.risks} />
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Card({
  title,
  tone,
  children
}: {
  title: string;
  tone: "emerald" | "rose" | "amber";
  children: React.ReactNode;
}): JSX.Element {
  const ring = {
    emerald: "border-emerald-100",
    rose: "border-rose-100",
    amber: "border-amber-100"
  }[tone];
  return (
    <div className={`card p-5 ${ring}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Tags({
  items,
  tone
}: {
  items: string[];
  tone: "emerald" | "rose";
}): JSX.Element {
  if (items.length === 0)
    return <span className="text-sm text-slate-500">None</span>;
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-rose-50 text-rose-800";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className={`badge ${cls}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: string[] }): JSX.Element {
  if (items.length === 0)
    return <span className="text-sm text-slate-500">None</span>;
  return (
    <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}
