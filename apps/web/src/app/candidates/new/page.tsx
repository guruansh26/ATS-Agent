"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NewCandidatePage(): JSX.Element {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    experienceYears: "",
    skills: "",
    education: "",
    workHistory: "",
    rawText: ""
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function asList(value: string): string[] {
    return value
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const candidate = await api.createCandidate({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        location: form.location || undefined,
        experienceYears: form.experienceYears
          ? Number(form.experienceYears)
          : undefined,
        skills: asList(form.skills),
        education: asList(form.education),
        workHistory: asList(form.workHistory),
        rawText: form.rawText || undefined
      });
      router.push(`/candidates/${candidate.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Add a candidate</h1>
      <p className="text-sm text-slate-500 mb-6">
        Fill in structured fields, paste resume text, or both. The AI will fill
        in the blanks.
      </p>

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Asha Verma"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Experience (years)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.experienceYears}
              onChange={(e) => update("experienceYears", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Skills (comma-separated)</label>
          <input
            className="input"
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder="TypeScript, Node.js, PostgreSQL"
          />
        </div>
        <div>
          <label className="label">Education (one per line)</label>
          <textarea
            className="input min-h-[60px]"
            value={form.education}
            onChange={(e) => update("education", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Work history (one per line)</label>
          <textarea
            className="input min-h-[80px]"
            value={form.workHistory}
            onChange={(e) => update("workHistory", e.target.value)}
            placeholder="Senior Engineer at Acme (2021-Present)"
          />
        </div>
        <div>
          <label className="label">Raw resume text (optional)</label>
          <textarea
            className="input min-h-[120px]"
            value={form.rawText}
            onChange={(e) => update("rawText", e.target.value)}
            placeholder="Paste the full resume here. The AI will extract any missing fields."
          />
        </div>

        {error ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">
            {error}
          </div>
        ) : null}

        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Adding..." : "Add candidate"}
        </button>
      </form>
    </div>
  );
}
