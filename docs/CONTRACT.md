# Data contract (v1) — the interface between modules

Change this file only after telling the whole team. Lead owns it.

## Files (M1 writes, M3 loads)
```
data/<business>_items.csv   item_id, name, category, unit, unit_cost_rm, supplier, supplier_phone,
                            lead_time_days, moq, current_stock, perishable, shelf_life_days
data/<business>_sales.csv   date, item_id, qty_sold, price_rm          (<business> = minimart | cafe)
data/forecasts_<business>.json   {item_id: {f, low, high}}   next 7 days
data/accuracy.json          {model_wape, baseline_wape, ma4_wape, weeks_tested}
```

## Python interfaces
```
src/engine/forecast.py      forecast(business, item_id) -> {"f": float, "low": float, "high": float}
src/services/explain.py     explain(numbers: dict) -> tuple[str, Literal["llm", "template"]]
src/security/auth.py        current_user  (FastAPI dependency) -> User{id, username, role, business}
src/security/policy.py      can(user, action, rec=None) -> tuple[bool, str]
                            actions: view, run_check, approve, edit, reject, settings
src/security/audit.py       append(actor, role, action, item, before, after, reason, business) -> AuditEntry
                            verify() -> {"ok": bool, "entries": int, "broken_at": int | None}
```

## HTTP API (M3 serves, M4 calls; all JSON; a session cookie is required except /api/login and /connect)
```
POST /api/login            {username, password}            -> {user}        demo users per business: owner, manager, staff
POST /api/logout                                           -> {ok}
GET  /api/me                                               -> {user}
POST /api/run-check        {business}                      -> {run_id, recommendations: [Rec]}
GET  /api/recommendations?business=minimart                -> [Rec]
POST /api/recommendations/<id>/approve   {qty?}            -> {po_id}       403 {detail} when not allowed (attempt is logged)
POST /api/recommendations/<id>/reject    {reason}          -> {ok}          403 {detail} when not allowed
GET  /api/purchase-orders?business=minimart                -> [PO]
GET  /api/purchase-orders/<po_id>                          -> PO
GET  /api/items?business=minimart                          -> [Item with last_8_weeks: number[]]
PATCH /api/items/<item_id> {lead_time_days?, moq?}         -> Item          owner only
GET  /api/log?business=minimart                            -> [LogEntry]    newest first
GET  /api/log/verify                                       -> {ok, entries, broken_at}
GET  /api/accuracy?business=minimart                       -> {model_wape, baseline_wape, weeks_tested}
POST /connect/v1/<business>/sales   CSV upload or [{date, item_id, qty_sold, price_rm}]
                                    header X-Api-Key       -> {rows, low_stock_triggered: [item_id]}
```

## Shapes
```
Rec      = {id, run_id, business, item_id, name, unit, supplier, current_stock, lead_time_days, moq,
            unit_cost_rm, forecast_7d, forecast_low, forecast_high, days_of_cover, suggested_qty,
            flag: "reorder" | "sales_drop" | "slow_mover" | "near_expiry",
            action, reason, reason_source: "llm" | "template", calc: {..steps shown in "Show the calculation"},
            last_8_weeks: number[], status: "pending" | "approved" | "edited" | "rejected", decided_by?}
PO       = {id, number, business, supplier, supplier_phone, lines: [{item_id, name, qty, unit, unit_cost_rm}],
            total_rm, approved_by, created_at, whatsapp_text, whatsapp_url}
LogEntry = {id, ts, actor, role, action: "run" | "approve" | "edit" | "reject" | "blocked" | "trigger" | "login",
            item, before, after, reason, business, hash}
User     = {id, username, display_name, role: "owner" | "manager" | "staff", business}
```

## Permission rules (M5 enforces)
- Staff: view, run_check. Manager: + approve/edit up to RM 500 per order, reject. Owner: everything incl. settings.
- Nobody acts on another business's data.
