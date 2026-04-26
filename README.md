# ATS AI Agent

> An AI-powered ATS screening and candidate matching agent for recruiters — paste a JD, drop in a resume, get a score breakdown, missing skills, strengths, risks, and a final recommendation.

---

## Why this project exists

Recruiters waste hours doing the same first-pass screening: matching a resume against a job, checking which skills are missing, judging whether the experience is right, and writing a sentence or two for the hiring manager.

**ATS AI Agent** automates the boring parts:

- **Deterministic scoring** computes the actual match (skills, experience, location, education) so you can trust the number.
- **LLM provider abstraction** writes the recruiter-friendly summary on top — but the LLM cannot move the score, so you stay in control.
- **Async pipeline** lets a recruiter queue dozens of screenings without the UI blocking.
- **Mock LLM provider** ships in the box, so the entire app runs locally with **no API keys**.

It's a small, realistic, production-shaped service — useful as a portfolio piece for a Joveo Full-Stack role because Joveo lives at the intersection of recruiting and ML/AI.

---

## Features

- **Job management** — create, list, fetch jobs with structured fields and/or raw JD text
- **Candidate management** — create, list, fetch candidates with structured fields and/or raw resume text
- **AI extraction agent** — pulls structured info out of free-text JDs and resumes
- **Matching agent** — deterministic skill/experience/location/education scoring, plus LLM-written summary
- **Async screening jobs** — BullMQ + Redis worker pipeline; screenings start `pending`, move to `processing`, end `completed` or `failed`
- **Recruiter dashboard** — Next.js 14 + Tailwind UI for jobs, candidates, screenings, and match results
- **Security** — `x-api-key` auth, Zod validation, rate limiting, helmet, CORS, env validation, no stack-trace leakage in prod
- **Structured logging** — Pino with `requestId`, `screeningId`, `bullJobId` correlation
- **Audit trail** — every important action persisted to `AuditLog`
- **Tests** — Vitest unit + API integration tests run without Postgres or Redis
- **Docker Compose** — one command to spin up the full stack

---

## Architecture

```
                          ┌────────────────────────────┐
                          │   Next.js + Tailwind UI    │
                          │     apps/web (port 3000)    │
                          └──────────────┬─────────────┘
                                         │ x-api-key
                                         ▼
┌──────────────┐   POST /api/screenings   ┌──────────────────────────┐
│ recruiter    │ ────────────────────────▶│  Fastify API             │
│ + curl       │                          │  apps/api  (port 4000)   │
└──────────────┘                          │                          │
                                          │  • zod validation        │
                                          │  • api-key auth          │
                                          │  • rate limiting          │
                                          │  • central error handler │
                                          │  • Prisma → PostgreSQL   │
                                          │  • enqueue → BullMQ      │
                                          └──────────────┬───────────┘
                                                         │
                          ┌──────────────────────────────┼─────────────┐
                          │                              ▼             │
                          │                    ┌──────────────────┐    │
                          │                    │   Redis (BullMQ) │    │
                          │                    └────────┬─────────┘    │
                          │                             │              │
                          │                             ▼              │
                          │                  ┌────────────────────┐    │
                          │                  │  Worker            │    │
                          │                  │  apps/worker       │    │
                          │                  │  • computeMatch()  │    │
                          │                  │  • LLM refine      │    │
                          │                  │  • persist result  │    │
                          │                  └─────────┬──────────┘    │
                          │                            │               │
                          ▼                            ▼               │
                ┌──────────────────────┐    ┌──────────────────────┐   │
                │ packages/shared      │    │ packages/llm         │   │
                │ • zod schemas        │    │ • LlmProvider        │   │
                │ • scoring engine     │    │ • MockLlmProvider    │   │
                │ • prompts            │    │ • OpenAiLlmProvider  │   │
                │ • normalization      │    └──────────────────────┘   │
                └──────────────────────┘                               │
                                                                       │
                                          ┌────────────────────────────┘
                                          ▼
                                ┌──────────────────────┐
                                │     PostgreSQL       │
                                │  Jobs / Candidates   │
                                │  Screenings / Audit  │
                                └──────────────────────┘
```

### Key design decisions

1. **Deterministic-first scoring.** The score is computed by `computeMatch()` in `packages/shared`. The LLM only writes the prose summary on top — it cannot raise or lower the number, so the system can't hallucinate a match.
2. **Provider abstraction.** `LlmProvider` is a 3-method interface (`extractResume`, `extractJob`, `refineSummary`). The `MockLlmProvider` ships with the project and works with zero API keys; the `OpenAiLlmProvider` works against any OpenAI-compatible endpoint (Azure OpenAI, OpenRouter, vLLM, Ollama, etc.).
3. **Workers, not request-time inference.** A recruiter can queue 50 screenings and walk away; the API stays responsive.
4. **Monorepo with thin shared packages.** Two reusable packages (`shared`, `llm`) so both the API and the worker stay tiny and use the exact same scoring and the exact same provider.

---

## Tech stack

| Layer        | Choice                                                     |
| ------------ | ---------------------------------------------------------- |
| Language     | TypeScript (strict, `noUncheckedIndexedAccess`)            |
| Runtime      | Node.js 20                                                  |
| API          | Fastify 4 + `@fastify/helmet` + `@fastify/cors` + `@fastify/rate-limit` |
| DB           | PostgreSQL + Prisma ORM                                     |
| Queue        | BullMQ on Redis                                             |
| Validation   | Zod                                                         |
| Logs         | Pino (+ `pino-pretty` in dev)                               |
| Frontend     | Next.js 14 (App Router) + Tailwind CSS                      |
| Tests        | Vitest                                                      |
| LLM provider | Pluggable (mock / OpenAI-compatible)                        |
| Container    | Docker + Compose (api, worker, web, postgres, redis)        |

---

## Project layout

```
ats-ai-agent/
├── apps/
│   ├── api/              # Fastify API service
│   │   ├── prisma/       # schema.prisma + seed.ts
│   │   └── src/
│   │       ├── app.ts             # plugin registration
│   │       ├── server.ts          # entrypoint
│   │       ├── config/env.ts      # zod-validated env
│   │       ├── lib/               # logger, prisma, queue, llm, errors
│   │       ├── plugins/           # auth, errorHandler (fastify-plugin)
│   │       ├── routes/            # jobs, candidates, screenings, health
│   │       └── services/          # business logic + audit logging
│   ├── worker/           # BullMQ worker process
│   └── web/              # Next.js + Tailwind dashboard
├── packages/
│   ├── shared/           # zod schemas, scoring engine, prompts, types
│   └── llm/              # LlmProvider abstraction, mock + openai impls
├── docker/               # api/worker/web Dockerfiles
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick start (local, no Docker)

You need Node.js 20+. PostgreSQL and Redis are only needed when actually running the API/worker; the **tests run with neither**.

```bash
# 1. Install
npm install

# 2. Run all unit + API tests (no Postgres/Redis required)
npm test

# 3. Typecheck every workspace
npm run typecheck

# 4. (Optional) bring up Postgres + Redis via Docker
docker compose up -d postgres redis

# 5. Generate Prisma client + run migrations + seed
cp .env.example .env
npm run db:generate
npm --workspace @ats/api run prisma:dev
npm run db:seed

# 6. Run the three processes (in separate terminals)
npm run dev:api      # → http://localhost:4000
npm run dev:worker
npm run dev:web      # → http://localhost:3000
```

Open <http://localhost:3000>, click **Run a screening**, and watch the result fill in live.

---

## Running with Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

This brings up:

| Service    | Port | What it does                                            |
| ---------- | ---- | ------------------------------------------------------- |
| `postgres` | 5432 | Persistent storage                                      |
| `redis`    | 6379 | BullMQ job queue                                        |
| `api`      | 4000 | Fastify API (runs Prisma migrations + seed on boot)     |
| `worker`   | —    | Pulls screening jobs off Redis and processes them       |
| `web`      | 3000 | Next.js recruiter dashboard                             |

Once they're up, open <http://localhost:3000>.

---

## Environment variables

All variables are validated with Zod at startup; an invalid `.env` makes the process exit with a clear message instead of crashing later.

| Variable             | Default                                            | Notes                                                |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`           | `development`                                      | `development` / `test` / `production`                |
| `PORT`               | `4000`                                             | API listening port                                   |
| `LOG_LEVEL`          | `info`                                             | Pino level                                           |
| `CORS_ORIGIN`        | `http://localhost:3000`                            | Comma-separated, or `*`                              |
| `DATABASE_URL`       | —                                                  | Postgres connection string                           |
| `REDIS_URL`          | `redis://localhost:6379`                           | Redis connection string                              |
| `API_KEYS`           | `dev-recruiter-key`                                | Comma-separated list of accepted `x-api-key` values  |
| `LLM_PROVIDER`       | `mock`                                             | `mock` (no API key) or `openai`                      |
| `OPENAI_API_KEY`     | —                                                  | Required when `LLM_PROVIDER=openai`                  |
| `OPENAI_MODEL`       | `gpt-4o-mini`                                      | Any OpenAI-compatible chat model                     |
| `OPENAI_BASE_URL`    | `https://api.openai.com/v1`                        | Override for Azure / OpenRouter / vLLM / Ollama-OAI  |
| `WORKER_CONCURRENCY` | `4`                                                | How many screenings the worker processes in parallel |
| `NEXT_PUBLIC_API_URL`| `http://localhost:4000`                            | Frontend → API base URL                              |
| `NEXT_PUBLIC_API_KEY`| `dev-recruiter-key`                                | API key the frontend sends                           |

---

## API documentation

All endpoints (except `/healthz` and `/readyz`) require `x-api-key`.

### `POST /api/jobs`

```bash
curl -X POST http://localhost:4000/api/jobs \
  -H "x-api-key: dev-recruiter-key" \
  -H "content-type: application/json" \
  -d '{
    "title": "Senior Backend Engineer",
    "company": "Joveo",
    "location": "Bangalore",
    "experienceMin": 5,
    "experienceMax": 9,
    "skills": ["TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS"]
  }'
```

You can also POST `{ "rawText": "<full JD>" }` and the AI extraction agent will fill in the structured fields.

### `GET /api/jobs` and `GET /api/jobs/:id`

```bash
curl -H "x-api-key: dev-recruiter-key" http://localhost:4000/api/jobs
curl -H "x-api-key: dev-recruiter-key" http://localhost:4000/api/jobs/<id>
```

### `POST /api/candidates`

```bash
curl -X POST http://localhost:4000/api/candidates \
  -H "x-api-key: dev-recruiter-key" \
  -H "content-type: application/json" \
  -d '{
    "name": "Asha Verma",
    "email": "asha@example.com",
    "location": "Bangalore",
    "experienceYears": 6,
    "skills": ["TypeScript", "Node.js", "PostgreSQL"]
  }'
```

Or pass `{ "rawText": "<full resume>" }` and the AI will extract everything.

### `GET /api/candidates` and `GET /api/candidates/:id`

### `POST /api/screenings`

```bash
curl -X POST http://localhost:4000/api/screenings \
  -H "x-api-key: dev-recruiter-key" \
  -H "content-type: application/json" \
  -d '{ "jobId": "<jobId>", "candidateId": "<candidateId>" }'
```

Returns `202` with the screening in `pending` status. The worker will pick it up.

### `GET /api/screenings/:id`

Returns the current state. Polling this until `status === "completed"` is a valid usage pattern (the UI does exactly that with a 1.5s interval).

```json
{
  "id": "...",
  "status": "completed",
  "overallScore": 88,
  "skillMatchScore": 100,
  "experienceMatchScore": 100,
  "locationMatchScore": 100,
  "educationMatchScore": 100,
  "matchedSkills": ["TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS"],
  "missingSkills": [],
  "strengths": ["Strong skill coverage (5/5)", "Experience aligns with the role"],
  "risks": [],
  "recruiterSummary": "We recommend moving forward: Asha Verma for Senior Backend Engineer...",
  "recommendation": "strong_match"
}
```

### `GET /api/jobs/:id/screenings`

Lists every screening run against a job, with the candidate joined in.

---

## How matching works

`computeMatch(job, candidate)` lives in `packages/shared/src/scoring.ts` and is fully unit-tested.

| Dimension       | Weight | How it's computed                                                                           |
| --------------- | ------ | ------------------------------------------------------------------------------------------- |
| **Skills**      | 50%    | `matched / required`. Skills are normalized (`TS` ≡ `TypeScript`, `node js` ≡ `Node.js`).   |
| **Experience**  | 25%    | `100` inside the `[min, max]` range; `-25/yr` if under, `-8/yr` if over (overshoot is softer than undershoot). |
| **Education**   | 15%    | Compares the highest detected level (`PhD > Master > Bachelor > Diploma`) to the JD's stated bar. |
| **Location**    | 10%    | `100` for `remote` on either side or exact match; `80` for token overlap (e.g. same country); `40` otherwise. |

The overall score is rounded to one decimal and then bucketed:

- `>= 80` → `strong_match`
- `>= 60` → `possible_match`
- `< 60`  → `weak_match`

The recruiter summary, strengths, and risks are derived deterministically from these numbers. The LLM may rewrite the summary into a friendlier paragraph but **cannot change the score or the recommendation**.

---

## How the AI provider abstraction works

```ts
export interface LlmProvider {
  readonly name: string;
  extractResume(rawText: string): Promise<ExtractedCandidate>;
  extractJob(rawText: string): Promise<ExtractedJob>;
  refineSummary(input: {
    breakdown: MatchBreakdown;
    candidateName: string;
    jobTitle: string;
  }): Promise<string>;
}
```

Two implementations live in `packages/llm/`:

1. **`MockLlmProvider`** — fully deterministic. It uses targeted regex/heuristics to pull skills, email, phone, location, education, and work history out of plain text. It produces a recruiter-friendly summary purely from the score breakdown. Identical input → identical output, every time. This is what powers the test suite and what runs by default.
2. **`OpenAiLlmProvider`** — a tiny `fetch`-based client that talks to any OpenAI-compatible `/chat/completions` endpoint (OpenAI, Azure OpenAI, OpenRouter, Together, vLLM, Ollama-OpenAI). It uses `response_format: { type: "json_object" }` for the extraction calls so we don't have to babysit formatting.

To switch provider, set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=...`. Nothing else in the code changes.

---

## How to run tests

```bash
npm test                           # all workspaces
npm --workspace @ats/shared test   # scoring engine
npm --workspace @ats/llm test      # mock provider
npm --workspace @ats/api test      # fastify API + services
npm --workspace @ats/worker test   # screening processor
```

The API tests use an **in-memory Prisma stand-in** (`apps/api/src/test/inMemoryPrisma.ts`) and a mocked queue, so they run with **no Postgres or Redis** required. They still exercise:

- API key authentication (401 on missing header)
- Zod validation (400 with `details`)
- Job/candidate/screening creation flow
- The full `performScreening` path end-to-end (deterministic + mock LLM)
- Not-found handling (404)

Total: **33 tests** across 5 test files.

---

## Security

- **API key** auth via `x-api-key`, validated against a configurable allow-list (`API_KEYS`).
- **Zod validation** on every body and query.
- **Rate limiting** at 120 req/min/IP via `@fastify/rate-limit` (health endpoints exempt).
- **Helmet** secure-header defaults.
- **CORS** explicit origin list (no `*` unless you opt in).
- **Env validation** at boot — bad config surfaces as a single readable error and the process exits.
- **Stack traces never leak** in `NODE_ENV=production`; the central error handler returns a generic `internal_error` payload while still logging the full error server-side.
- **Pino redacts** auth headers from request logs.
- **Prisma parameterised queries** — no string-concatenated SQL anywhere.

For real production use you would also: rotate API keys via the `ApiKey` table (already modelled), add per-tenant quotas, and add structured request audit logs.

---

## Audit logging

Every important state transition is persisted to `AuditLog`:

| Action                | When                                              |
| --------------------- | ------------------------------------------------- |
| `job_created`         | After a job is inserted                           |
| `candidate_created`   | After a candidate is inserted                     |
| `screening_requested` | When a recruiter enqueues a screening             |
| `screening_completed` | When the worker finishes successfully             |
| `screening_failed`    | When the worker errors after all retries          |

Schema is `apps/api/prisma/schema.prisma`.

---

## Demo data

`npm run db:seed` populates:

- **2 jobs** — Senior Backend Engineer, Machine Learning Engineer
- **5 candidates** — covering strong/possible/weak match cases
- **5 screenings** — already completed, with one **strong**, one **possible**, and one **weak** match per job so the dashboard has interesting content immediately.

---

## Future improvements

- Resume PDF parsing (currently the API takes raw text — adding a PDF/Doc upload step is a small extension).
- Streaming the LLM summary back to the UI.
- Embedding-based skill matching (semantic similarity) as an additional signal.
- A `/api/jobs/:id/recommendations` endpoint that ranks all candidates against a job in one go.
- Per-tenant quotas + per-API-key rate limits.
- Bias auditing report (does the score correlate with anything we don't want it to?).

---

## What this project demonstrates

- **Backend API design** — Fastify, Zod, central error handler, plugin scoping, rate limiting, structured logging, env validation
- **AI/LLM integration** — clean provider abstraction, prompts treated as code, deterministic scoring as the source of truth
- **Async job processing** — BullMQ + Redis with retries, exponential backoff, completion/failure audit trail
- **Full-stack product thinking** — the recruiter's actual workflow is reflected in both API design and UI flow
- **Testing discipline** — 33 unit + API integration tests that run without external services
- **Production-style architecture** — npm workspaces monorepo, Docker Compose, healthchecks, structured logs with request IDs
- **Domain understanding** — ATS / recruiting / candidate scoring is treated as a real domain, not a toy

---

## License

MIT.
