import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <div className="card p-8 text-center space-y-3">
      <h1 className="text-xl font-semibold text-slate-900">Not found</h1>
      <p className="text-sm text-slate-600">
        The page or resource you were looking for doesn't exist.
      </p>
      <Link href="/" className="btn-primary inline-block">
        Back home
      </Link>
    </div>
  );
}
