# Contract Coach

**Upload an agreement. Get a clause-by-clause review grounded in a corpus of reference contracts, and a structured report.**

Live demo: **https://contract-coach.vercel.app**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Open-source. MIT licensed. Run it yourself, fork it, build on it.

---

## What it does

1. **Ingest** — accepts PDF and DOCX, extracts clean text server-side (Mammoth for DOCX).
2. **Retrieve** — pulls relevant clauses from a corpus of reference contracts in Postgres, so the model reasons against real drafting patterns. Retrieval-augmented generation over a domain corpus, not a single-shot prompt.
3. **Analyze** — Gemini 2.0 Flash reviews the document clause by clause against what it retrieved.
4. **Improve** — proposes specific redlines and rewrites, with a guided drafting wizard for building an agreement from scratch.
5. **Report** — renders a structured PDF you can send on.

## Architecture

| Layer | Implementation |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind, Radix UI |
| API | Supabase Edge Functions (Deno) — `analyze-contract`, `upgrade-contract`, `extract-text`, `assign-admin` |
| Model | Gemini 2.0 Flash |
| Retrieval | Reference-contract corpus in Postgres, queried per analysis |
| Data | Postgres with row-level security; policies scoped to `auth.uid()` |
| Access | Role-based access control with an admin assignment path |
| Billing | Subscription gating on full analysis and upgrade output |

Auth and tenancy live at the data layer. Row-level security policies mean Postgres refuses an unauthorized read. The frontend cannot skip that check because the frontend is not the one making it.

## The retrieval design

Most contract-review tools send the document to a model and ask what looks wrong. That produces generic answers, because the model is reasoning from whatever it absorbed in training.

This one retrieves first. A corpus of reference agreements sits in Postgres; each analysis pulls the clauses relevant to the document in front of it and gives the model something concrete to compare against. The review comes back anchored to how these clauses get drafted in practice, not to an average of the internet.

The same corpus drives the drafting wizard, so generated language matches the patterns the analysis is measuring against.

## Not legal advice

This is software. It reviews documents and returns structured output. It does not create an attorney-client relationship, it is not a substitute for a lawyer, and no one should treat its output as legal advice.

## Run it

Requires a Supabase project and a Gemini API key.

```
npm install
npm run dev
```

Edge functions deploy through the Supabase CLI. Database schema and row-level security policies are in `supabase/migrations`.

## Related

- **[Switchboard](https://github.com/TattedLawyer/switchboard-ai-integration)** — supervised AI outreach and data integration. Connects systems that do not share data and puts an approval-gated agent on top.
- **[YapWorld](https://yapworld.net)** · **[YapHealth](https://yaphealth.net)** · **[YapCare](https://yapcare.net)** — one agentic infrastructure serving consumer, health and aged-care markets.

## License

MIT — see [LICENSE](LICENSE).

---

`RAG` · `retrieval-augmented generation` · `LLM` · `Gemini` · `document processing` · `Supabase` · `Edge Functions` · `Deno` · `PostgreSQL` · `row-level security` · `RBAC` · `React` · `TypeScript` · `Vite` · `Tailwind`
