# Restock Autopilot web app (M4)

Vite + React + TypeScript + Tailwind v4 + shadcn/ui. Primary colour Orbyte navy `#0B1E4D`.

```
npm install
npm run dev:mock   # http://localhost:5173 with the in-browser mock API (no backend needed)
npm run dev        # same, but talks to FastAPI: proxies /api and /connect to http://localhost:8000
npm test           # vitest: decide() parity with the prototype, permissions, audit chain, mock server
npm run build      # writes dist/, which FastAPI serves at /
```

- `src/api.ts`: every server call, with types copied from `docs/CONTRACT.md`.
- `src/mocks/`: used only when `VITE_USE_MOCK=1` (set in `.env.mock`). `decide()` is ported from
  `docs/prototype/restock-prototype.html`; `policy.ts` and `audit.ts` mirror M5's server rules.
