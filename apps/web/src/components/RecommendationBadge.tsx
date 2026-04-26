import type { Recommendation, ScreeningStatus } from "@/lib/api";

const REC_STYLES: Record<Recommendation, string> = {
  strong_match: "bg-emerald-100 text-emerald-800",
  possible_match: "bg-amber-100 text-amber-800",
  weak_match: "bg-rose-100 text-rose-800"
};
const REC_LABELS: Record<Recommendation, string> = {
  strong_match: "Strong match",
  possible_match: "Possible match",
  weak_match: "Weak match"
};

export function RecommendationBadge({
  value
}: {
  value: Recommendation | null;
}): JSX.Element {
  if (!value) return <span className="badge bg-slate-100 text-slate-700">Pending</span>;
  return <span className={`badge ${REC_STYLES[value]}`}>{REC_LABELS[value]}</span>;
}

const STATUS_STYLES: Record<ScreeningStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800"
};

export function StatusBadge({ value }: { value: ScreeningStatus }): JSX.Element {
  return <span className={`badge ${STATUS_STYLES[value]}`}>{value}</span>;
}
