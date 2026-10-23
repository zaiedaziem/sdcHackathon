# Restock Autopilot — SDC Hackathon 2026, Domain 2

Restock Autopilot is an Orbyte module for Malaysian micro and small shops (minimart, cafe, hardware, pharmacy, online seller). Every week it reads sales and stock, forecasts demand, and proposes what to reorder with a plain-language reason. An Owner or Manager approves, and the result is a purchase order, a WhatsApp-style supplier message and an activity log entry.

Domain 2 brief: "Orbyte Smart SME Challenge: Less Busywork, Better Business" (sponsor Alpha Red Solutions). SDG 8.2 and 8.3.
Official resources (brief, handbooks, workshop sheets) are in the parent folder `../` on Rafeeq's laptop.

## Deadline
- Preliminary submission closes **Sun 25 Oct 2026, 07:59:59 AM MYT** (Participant Handbook). Team target: submit Sat 24 Oct 22:00.
- Feature freeze: Sat 24 Oct 12:00. After that, bug fixes and submission work only.
- No commits after submitting. A single giant last-minute commit gets reviewed by the committee.

## Team and modules
| Module | Owner | Folder |
| --- | --- | --- |
| M1 Forecast engine (synthetic data, LightGBM, evaluation) | AI / data | `src/engine/`, `data/` |
| M2 Explain service (RunPod LLM + number guard + template fallback) | AI / data | `src/services/explain.py`, `runpod/` |
| M3 Workflow API (FastAPI, reorder rules, approvals, purchase orders, Connect ingest, scheduler) | Lead | `src/main.py`, `src/api/`, `src/core/` |
| M4 Web app (React + Vite + TypeScript + Tailwind + shadcn/ui) | App / UI | `src/web/` |
| M5 Trust layer (demo login, policy, hash-chained audit log, PDPA) | Security | `src/security/`, `docs/PDPA.md` |

The interface between modules is `docs/CONTRACT.md`. Read it before writing any endpoint, type or fetch call. If a change to the contract is needed, stop and tell the user; four people build against it.
Step-by-step playbook per module: the team's "Restock Autopilot Module Playbook" doc. Kickoff prompts: `docs/claude-code-prompts.md`.
Working UI prototype with the reorder logic (`decide()`): `docs/prototype/restock-prototype.html`. Port from it; don't reinvent.

## Stack
- Python 3.11, FastAPI, Uvicorn, SQLModel on SQLite, APScheduler, pandas, LightGBM, `holidays` (Malaysia), passlib[bcrypt], itsdangerous, `openai` client (for RunPod), pytest.
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui, React Router, TanStack Query, lucide-react, Recharts. Primary colour Orbyte navy `#0B1E4D`. Built to `src/web/dist`, served by FastAPI at `/` (one URL).
- LLM: RunPod Serverless vLLM, `Qwen/Qwen2.5-7B-Instruct` (Apache 2.0; never the 3B, research-only licence). OpenAI-compatible base URL `https://api.runpod.ai/v2/<RUNPOD_ENDPOINT_ID>/openai/v1`.
- Hosting: Replit (compulsory). GPU work: RunPod (compulsory, with proof).

## Commands (Windows dev machine; Replit runs Linux)
```
python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000          # API + /docs
cd src\web && npm install && npm run dev            # UI on :5173, proxies /api and /connect to :8000
cd src\web && npm run build                          # dist/ served by FastAPI
python -m pytest -q
```

## Rules that cost points (non-negotiable)
- Synthetic data only, created by our own generator. No real shop, customer or personal records, and no public datasets of real shops.
- Never commit secrets. Keys live in `.env` locally and Replit Secrets in deployment. `.env`, `*.db`, `node_modules/`, `dist/` stay ignored.
- The LLM only rewords numbers our code computed. Forecasts, quantities and money never come from the LLM.
- Recommendations are operational (what to reorder), never financial or legal advice. No real payments or filings. Nothing is sent to suppliers automatically.
- Permissions are enforced on the server via `can(user, action, rec)`. Hiding a button is not security.
- Don't rebuild Orbyte's HR/admin features (leave, claims, attendance, hiring, eSign).
- Every AI tool used gets declared. Claude Code's Co-Authored-By trailer stays on commits.

## How to work in this repo (instructions for Claude)
- One module per session. Stay inside your module's folder; if another module's file needs changing, say so and ask first.
- Work on a branch named `<module>/<task>` (for example `m4/recommendation-cards`), never on `main`. Pull `main` first.
- Commit small and often with clear messages, from the user's own git account. Several commits per task is normal.
- Plan briefly before large changes. After each step, tell the user how to run and see it.
- The user must be able to explain every line to judges. Prefer plain, readable code over clever code, and explain non-obvious parts in a sentence when you finish.
- Add or update tests for logic you write (reorder rules, policy, audit chain, explain guard, engine).
- Keep the demo path working at all times: Run weekly check → cards with reasons → Staff blocked → Manager blocked over RM 500 → Owner approves → purchase order + WhatsApp draft → activity log entry → chain verified.
