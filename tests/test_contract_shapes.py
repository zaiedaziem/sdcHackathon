"""Every endpoint in docs/CONTRACT.md answers, in the contract's shape."""

from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)

REC_KEYS = {
    "id", "run_id", "business", "item_id", "name", "unit", "supplier", "current_stock", "lead_time_days", "moq",
    "unit_cost_rm", "forecast_7d", "forecast_low", "forecast_high", "days_of_cover", "suggested_qty", "flag",
    "action", "reason", "reason_source", "calc", "last_8_weeks", "status", "decided_by",
}
PO_KEYS = {
    "id", "number", "business", "supplier", "supplier_phone", "lines", "total_rm", "approved_by", "created_at",
    "whatsapp_text", "whatsapp_url",
}
LOG_KEYS = {"id", "ts", "actor", "role", "action", "item", "before", "after", "reason", "business", "hash"}
USER_KEYS = {"id", "username", "display_name", "role", "business"}


def ok(method, path, **kw):
    r = client.request(method, path, **kw)
    assert r.status_code == 200, r.text
    return r.json()


def test_session_endpoints():
    assert set(ok("POST", "/api/login", json={"username": "minimart_owner", "password": "demo"})["user"]) == USER_KEYS
    assert set(ok("GET", "/api/me")["user"]) == USER_KEYS
    assert ok("POST", "/api/logout") == {"ok": True}


def test_recommendation_endpoints():
    run = ok("POST", "/api/run-check", json={"business": "minimart"})
    assert set(run) == {"run_id", "recommendations"}
    assert set(run["recommendations"][0]) == REC_KEYS
    recs = ok("GET", "/api/recommendations?business=minimart")
    assert set(recs[0]) == REC_KEYS
    assert set(ok("POST", f"/api/recommendations/{recs[0]['id']}/approve", json={})) == {"po_id"}
    assert ok("POST", f"/api/recommendations/{recs[0]['id']}/reject", json={"reason": "x"}) == {"ok": True}


def test_purchase_order_endpoints():
    pos = ok("GET", "/api/purchase-orders?business=minimart")
    assert set(pos[0]) == PO_KEYS
    assert set(ok("GET", f"/api/purchase-orders/{pos[0]['id']}")) == PO_KEYS
    assert pos[0]["whatsapp_url"].startswith("https://wa.me/")


def test_item_log_and_accuracy_endpoints():
    items = ok("GET", "/api/items?business=minimart")
    assert len(items[0]["last_8_weeks"]) == 8
    assert ok("PATCH", f"/api/items/{items[0]['item_id']}", json={"moq": 10})["moq"] == 10
    assert set(ok("GET", "/api/log?business=minimart")[0]) == LOG_KEYS
    assert set(ok("GET", "/api/log/verify")) == {"ok", "entries", "broken_at"}
    assert set(ok("GET", "/api/accuracy?business=minimart")) == {"model_wape", "baseline_wape", "weeks_tested"}


def test_connect_endpoint():
    csv = b"date,item_id,qty_sold,price_rm\n2026-10-19,M01,2,38.9\n"
    r = ok("POST", "/connect/v1/minimart/sales", files={"file": ("sales.csv", csv, "text/csv")},
           headers={"X-Api-Key": "demo-key"})
    assert set(r) == {"rows", "low_stock_triggered"}


def test_validation_rejects_unknown_business_and_empty_reason():
    assert client.get("/api/recommendations?business=bakery").status_code == 422
    assert client.post("/api/recommendations/1/reject", json={"reason": ""}).status_code == 422
