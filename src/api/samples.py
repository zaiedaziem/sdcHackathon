"""Hard-coded sample responses (step 2 stubs), in the exact contract shapes.

The numbers are the prototype's output for three minimart items, so the web app shows
realistic cards before the real endpoints exist. All names and figures are synthetic.
"""

SAMPLE_USER = {
    "id": 1,
    "username": "minimart_owner",
    "display_name": "Puan Aisyah",
    "role": "owner",
    "business": "minimart",
}

SAMPLE_RECS = [
    {
        "id": 1, "run_id": 1, "business": "minimart", "item_id": "M01", "name": "Beras wangi 10kg", "unit": "bag",
        "supplier": "Borong Jaya", "current_stock": 6, "lead_time_days": 3, "moq": 5, "unit_cost_rm": 34.0,
        "forecast_7d": 14, "forecast_low": 12, "forecast_high": 15, "days_of_cover": 3.1, "suggested_qty": 15,
        "flag": "reorder", "action": "Reorder",
        "reason": "Stock covers about 3.1 days, but the supplier takes 3 days. Expected sales are 12 to 15 next week. "
                  "Order 15 bags (minimum order 5).",
        "reason_source": "template",
        "calc": {
            "forecast next 7 days": "0.4×13 + 0.3×15 + 0.2×13 + 0.1×14 = 14",
            "range (80%)": "12 to 15   (weekly swing σ = 1.1)",
            "daily rate": "2   → stock 6 lasts 3.1 days",
            "cover needed": "lead 3d + review 7d = 10 days",
            "need": "2×10 + safety 1 = 21",
            "order": "round up (21 − 6) to min. order 5 = 15",
            "order value": "15 × RM 34.00 = RM 510.00",
        },
        "last_8_weeks": [13, 12, 15, 13, 14, 13, 15, 13], "status": "pending", "decided_by": None,
    },
    {
        "id": 2, "run_id": 1, "business": "minimart", "item_id": "M08", "name": "Sardin tin 425g", "unit": "tin",
        "supplier": "Borong Jaya", "current_stock": 70, "lead_time_days": 3, "moq": 24, "unit_cost_rm": 6.4,
        "forecast_7d": 1, "forecast_low": 1, "forecast_high": 1, "days_of_cover": 490, "suggested_qty": 0,
        "flag": "slow_mover", "action": "Pause reordering",
        "reason": "Only 1 sold last week and 70 on the shelf, which is about 70 weeks of stock. "
                  "Pause reordering until stock falls below 4 weeks.",
        "reason_source": "template",
        "calc": {
            "forecast next 7 days": "0.4×1 + 0.3×1 + 0.2×1 + 0.1×1 = 1",
            "range (80%)": "1 to 1   (weekly swing σ = 0)",
            "daily rate": "0.1   → stock 70 lasts 490 days",
            "suggested": "0 (pause reordering)",
            "order value": "0 × RM 6.40 = RM 0.00",
        },
        "last_8_weeks": [1, 1, 1, 1, 1, 1, 1, 1], "status": "pending", "decided_by": None,
    },
    {
        "id": 3, "run_id": 1, "business": "minimart", "item_id": "M10", "name": "Roti bun kaya", "unit": "pack",
        "supplier": "Kilang Roti Sentosa", "current_stock": 38, "lead_time_days": 1, "moq": 10, "unit_cost_rm": 2.4,
        "forecast_7d": 34, "forecast_low": 31, "forecast_high": 38, "days_of_cover": 7.8, "suggested_qty": 0,
        "flag": "near_expiry", "action": "Move to front and bundle",
        "reason": "38 in stock but only about 15 will sell within the 3-day shelf life. Around 23 could expire. "
                  "Don't reorder; move them to the front shelf or bundle them.",
        "reason_source": "template",
        "calc": {
            "forecast next 7 days": "0.4×37 + 0.3×32 + 0.2×32 + 0.1×35 = 34",
            "range (80%)": "31 to 38   (weekly swing σ = 2.5)",
            "daily rate": "4.9   → stock 38 lasts 7.8 days",
            "shelf-life cap": "3 days → 15",
            "suggested": "0 (move to front and bundle)",
            "order value": "0 × RM 2.40 = RM 0.00",
        },
        "last_8_weeks": [31, 32, 36, 37, 35, 32, 32, 37], "status": "pending", "decided_by": None,
    },
]

_WA_TEXT = (
    "Hi Borong Jaya, this is Kedai Runcit Maju. We'd like to order:\n• 15 × Beras wangi 10kg\n\n"
    "Order ref PO-1041. Please confirm the price and delivery date. Thank you!"
)

SAMPLE_PO = {
    "id": 1, "number": "PO-1041", "business": "minimart", "supplier": "Borong Jaya",
    # Fictional number in an unassigned range, so the link can never reach a real person.
    "supplier_phone": "60000000101",
    "lines": [{"item_id": "M01", "name": "Beras wangi 10kg", "qty": 15, "unit": "bag", "unit_cost_rm": 34.0}],
    "total_rm": 510.0, "approved_by": "Puan Aisyah (Owner)", "created_at": "2026-10-19T08:05:00+08:00",
    "whatsapp_text": _WA_TEXT,
    "whatsapp_url": "https://wa.me/60000000101?text=Hi%20Borong%20Jaya%2C%20this%20is%20Kedai%20Runcit%20Maju.",
}

SAMPLE_ITEMS = [
    {"item_id": "M01", "name": "Beras wangi 10kg", "category": "Dry goods", "unit": "bag", "unit_cost_rm": 34.0,
     "supplier": "Borong Jaya", "supplier_phone": "60000000101", "lead_time_days": 3, "moq": 5, "current_stock": 6,
     "perishable": False, "shelf_life_days": None, "last_8_weeks": [13, 12, 15, 13, 14, 13, 15, 13]},
    {"item_id": "M08", "name": "Sardin tin 425g", "category": "Canned", "unit": "tin", "unit_cost_rm": 6.4,
     "supplier": "Borong Jaya", "supplier_phone": "60000000101", "lead_time_days": 3, "moq": 24, "current_stock": 70,
     "perishable": False, "shelf_life_days": None, "last_8_weeks": [1, 1, 1, 1, 1, 1, 1, 1]},
    {"item_id": "M10", "name": "Roti bun kaya", "category": "Bakery", "unit": "pack", "unit_cost_rm": 2.4,
     "supplier": "Kilang Roti Sentosa", "supplier_phone": "60000000102", "lead_time_days": 1, "moq": 10,
     "current_stock": 38, "perishable": True, "shelf_life_days": 3, "last_8_weeks": [31, 32, 36, 37, 35, 32, 32, 37]},
]

SAMPLE_LOG = [
    {"id": 3, "ts": "2026-10-19T08:05:00+08:00", "actor": "Puan Aisyah", "role": "owner", "action": "approve",
     "item": "Beras wangi 10kg", "before": 15, "after": 15, "reason": "Reorder", "business": "minimart",
     "hash": "c3" * 32},
    {"id": 2, "ts": "2026-10-19T08:03:00+08:00", "actor": "Daniel", "role": "manager", "action": "blocked",
     "item": "Beras wangi 10kg", "before": 15, "after": 15,
     "reason": "Tried to approve; This order is RM 510.00. Managers can approve up to RM 500.00, so it needs the Owner.",
     "business": "minimart", "hash": "b2" * 32},
    {"id": 1, "ts": "2026-10-19T08:00:00+08:00", "actor": "Scheduler", "role": "system", "action": "run",
     "item": "All items", "before": None, "after": "9 recommendations", "reason": "Weekly run, 10 items checked",
     "business": "minimart", "hash": "a1" * 32},
]

SAMPLE_VERIFY = {"ok": True, "entries": 3, "broken_at": None}

# Placeholder figures until M1 writes data/accuracy.json.
SAMPLE_ACCURACY = {"model_wape": 0.24, "baseline_wape": 0.31, "weeks_tested": 8}
