import Link from "next/link";

export function Nav(): JSX.Element {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center font-bold">
            A
          </div>
          <div>
            <div className="font-semibold text-slate-900">ATS AI Agent</div>
            <div className="text-xs text-slate-500 -mt-0.5">
              Recruiter screening, automated.
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/jobs"
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            Jobs
          </Link>
          <Link
            href="/candidates"
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            Candidates
          </Link>
          <Link
            href="/screenings/new"
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            Screen
          </Link>
        </nav>
      </div>
    </header>
  );
}
