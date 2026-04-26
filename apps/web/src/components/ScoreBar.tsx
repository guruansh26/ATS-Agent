export function ScoreBar({
  label,
  value
}: {
  label: string;
  value: number | null;
}): JSX.Element {
  const v = value ?? 0;
  const color =
    v >= 80
      ? "bg-emerald-500"
      : v >= 60
      ? "bg-amber-500"
      : v > 0
      ? "bg-rose-500"
      : "bg-slate-300";
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="font-medium text-slate-900">
          {value == null ? "—" : `${v}/100`}
        </span>
      </div>
      <div className="h-2 mt-1 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
