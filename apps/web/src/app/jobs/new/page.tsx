"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NewJobPage(): JSX.Element {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    experienceMin: "",
    experienceMax: "",
    skills: "",
    requirements: "",
    responsibilities: "",
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
      const payload = {
        title: form.title,
        company: form.company || undefined,
        location: form.location || undefined,
        experienceMin: form.experienceMin ? Number(form.experienceMin) : undefined,
        experienceMax: form.experienceMax ? Number(form.experienceMax) : undefined,
        skills: asList(form.skills),
        requirements: asList(form.requirements),
        responsibilities: asList(form.responsibilities),
        rawText: form.rawText || undefined
      };
      const job = await api.createJob(payload);
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Create a job</h1>
      <p className="text-sm text-slate-500 mb-6">
        You can fill the structured fields, paste the raw JD text, or both —
        the AI extraction will fill in any blanks.
      </p>

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Senior Backend Engineer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Company</label>
            <input
              className="input"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Joveo"
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Bangalore / Remote"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min experience (years)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.experienceMin}
              onChange={(e) => update("experienceMin", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Max experience (years)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.experienceMax}
              onChange={(e) => update("experienceMax", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Skills (comma-separated)</label>
          <input
            className="input"
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder="TypeScript, Node.js, PostgreSQL, Redis"
          />
        </div>
        <div>
          <label className="label">Requirements (one per line)</label>
          <textarea
            className="input min-h-[80px]"
            value={form.requirements}
            onChange={(e) => update("requirements", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Responsibilities (one per line)</label>
          <textarea
            className="input min-h-[80px]"
            value={form.responsibilities}
            onChange={(e) => update("responsibilities", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Raw JD text (optional)</label>
          <textarea
            className="input min-h-[120px]"
            value={form.rawText}
            onChange={(e) => update("rawText", e.target.value)}
            placeholder="Paste the full job description here. The AI will extract any missing fields."
          />
        </div>

        {error ? (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">
            {error}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Creating..." : "Create job"}
          </button>
        </div>
      </form>
    </div>
  );
}
