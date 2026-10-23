# Claude Code kickoff prompts

Open a terminal in the repo folder, run `claude`, and paste the prompt for your module. Claude Code reads `CLAUDE.md` automatically.
Start each prompt with plan mode (Shift+Tab twice) if you want to review the plan before it edits anything.
Each person runs their own prompt on their own laptop and git account, so the commit history shows four real contributors.

---

## 0. Setup commit (Rafeeq, once, now)

```
Create branch setup/claude-code, then commit CLAUDE.md, docs/CONTRACT.md, docs/claude-code-prompts.md,
docs/prototype/restock-prototype.html and the .gitignore change as one commit:
"Add Claude Code project context, data contract and prototype". Push and open a PR to main with gh if available,
otherwise give me the compare link. Don't change anything else.
```

---

## M4 Web app (App / UI)

```
I own M4, the web app. Read CLAUDE.md, docs/CONTRACT.md and docs/prototype/restock-prototype.html first.

Goal for this session: a running React app in src/web that shows the full demo path on mock data,
looking like an Orbyte module (navy #0B1E4D, clean business UI, left sidebar).

Work on branch m4/web-app. Do it in these steps and commit after each one:
1. Scaffold src/web with Vite (react-ts), Tailwind and shadcn/ui. Add components: button, card, badge, table,
   dialog, input, select, tabs, sonner, dropdown-menu, sheet, tooltip, skeleton, alert. Set the primary colour to
   #0B1E4D. Configure the Vite proxy for /api and /connect to http://localhost:8000.
2. Add React Router, TanStack Query and lucide-react. Build the app shell: sidebar (Weekly check, Purchase orders,
   Activity log, Stock data, Settings), top bar with business switcher (minimart, cafe), demo user menu
   (Owner, Manager, Staff) and a "synthetic data" badge.
3. Write src/web/src/api.ts with TypeScript types copied from docs/CONTRACT.md. When VITE_USE_MOCK=1, serve mock
   data from src/web/src/mocks/ built from the prototype's items and its decide() logic (port it to TypeScript),
   including 403 responses for Staff and for Managers over RM 500, and an in-memory activity log.
4. Weekly check page: Run button with the 5-step progress strip, summary tiles, recommendation cards (facts,
   8-week sparkline, reason with llm/template badge, collapsible "Show the calculation", Approve / Edit dialog /
   Reject dialog with required reason). A 403 shows a toast with the server's reason.
5. Purchase orders page (line table, WhatsApp draft, Copy, Open in WhatsApp link), Activity log page (table,
   filters by action and role, "chain intact" badge), Stock data page (table + CSV upload), Settings (owner only).
6. Loading, empty and error states everywhere; check at 390px and 1280px wide.

After each step tell me the exact command to run it and what I should see. Stop after step 2 so I can look.
```

---

## M3 Workflow API (Lead)

```
I own M3, the workflow API. Read CLAUDE.md and docs/CONTRACT.md first.
Branch m3/api. Commit after each step.
1. Make src a package, create the FastAPI app in src/main.py, update requirements.txt and .replit
   (run: uvicorn src.main:app --host 0.0.0.0 --port 8000). Remove the template's greeting code and its test.
2. Stub EVERY endpoint in the contract with hard-coded sample JSON in the exact shapes, so the UI can switch
   to the real API early. Push this before anything else.
3. SQLModel tables in src/core/models.py and db.py; seed from data/*.csv when the DB is empty.
4. src/core/reorder.py: port decide() from docs/prototype/restock-prototype.html as a pure function, with
   table-driven tests in tests/test_reorder.py (one row per rule).
5. Real run-check, approve/edit/reject, purchase orders (with wa.me link), log, accuracy. Use placeholder
   functions for forecast(), explain(), current_user, can() and audit.append() with the exact signatures in the
   contract, so M1, M2 and M5 can drop in their real versions.
6. Connect ingest endpoint and the APScheduler Monday 08:00 Asia/Kuala_Lumpur job.
7. Serve src/web/dist at / after the API routes. Add .github/workflows/test.yml running pytest.
Tell me how to try each step in /docs.
```

---

## M1 Forecast engine + M2 Explain service (AI / data)

```
I own M1 and M2. Read CLAUDE.md and docs/CONTRACT.md first.
Branch m1/engine. Commit after each step.
1. src/engine/data_gen.py: deterministic synthetic daily sales (fixed seed) from 2025-04-01 to last Sunday for
   data/minimart_items.csv (40 items) and data/cafe_items.csv (15 items) in the contract's columns. Include
   steady, trending, Raya/CNY/school-holiday seasonal, slow-mover, sudden-drop and perishable items. Use the
   `holidays` package for Malaysia; treat the 30 days before Hari Raya Aidilfitri as Ramadan.
2. src/engine/features.py and train.py: weekly features using past weeks only; one global LightGBM plus 10% and 90%
   quantile models; hold out the last 8 weeks.
3. src/engine/evaluate.py: WAPE for the model, "same as last week" and 4-week average; write data/accuracy.json
   and two actual-vs-forecast PNGs to docs/.
4. src/engine/forecast.py: precompute data/forecasts_<business>.json and expose forecast() per the contract.
5. tests/test_engine.py: same seed same data, no negatives, Raya lift, model beats baseline.
Then branch m2/explain:
6. src/services/explain.py: call RunPod (Qwen/Qwen2.5-7B-Instruct via the openai client and
   RUNPOD_API_KEY / RUNPOD_ENDPOINT_ID from .env), temperature 0.2, max 80 tokens, 15 s timeout, parallel for many
   cards. Number guard: every number in the reply must appear in the input, max 2 sentences, no
   profit/invest/guarantee words; otherwise use the template sentence (port from the prototype).
7. tests/test_explain_guard.py with fake replies: good, invented number, empty, timeout.
Explain the accuracy result to me in one sentence I can put in the proposal.
```

---

## M5 Trust layer (Security)

```
I own M5, the trust layer. Read CLAUDE.md and docs/CONTRACT.md first.
Branch m5/trust. Commit after each step.
1. src/security/auth.py: User table, bcrypt-hashed demo accounts (owner, manager, staff) per business,
   /api/login, /api/logout, /api/me, Starlette SessionMiddleware with SECRET_KEY from env (httponly,
   samesite=lax), current_user dependency (401 if missing), lock after 5 failed logins per minute.
2. src/security/policy.py: PERMISSIONS table + can(user, action, rec) -> (ok, reason), including the Manager
   RM 500 limit, owner-only settings and business scoping.
3. src/security/audit.py: append-only log with prev_hash/hash = SHA-256(prev_hash + canonical JSON), verify(),
   GET /api/log/verify, and SQLite triggers that abort UPDATE/DELETE on the audit table.
4. Connect API keys: one per business, stored hashed, compared with hmac.compare_digest.
5. tests/test_policy.py (every cell of the matrix, the RM 500 edge, cross-business), tests/test_audit_chain.py
   (tamper one row, verify points at it), tests/test_auth.py (401, 403 + blocked log entry).
6. docs/PDPA.md: one line per PDPA principle for this module, plus a short threat table for the slides.
Explain each security decision to me in plain words so I can defend it to judges.
```
