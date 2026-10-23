"""Request and response shapes, copied from docs/CONTRACT.md (v1).

FastAPI checks every response against these, so if an endpoint drifts from the
contract the request fails loudly instead of the web app breaking quietly.
"""

from typing import Literal, Optional, Union

from pydantic import BaseModel, Field

Business = Literal["minimart", "cafe"]
Role = Literal["owner", "manager", "staff"]
Flag = Literal["reorder", "sales_drop", "slow_mover", "near_expiry"]
RecStatus = Literal["pending", "approved", "edited", "rejected"]
LogAction = Literal["run", "approve", "edit", "reject", "blocked", "trigger", "login"]
Scalar = Union[int, float, str, None]


# ---------- shapes ----------

class User(BaseModel):
    id: int
    username: str
    display_name: str
    role: Role
    business: Business


class Rec(BaseModel):
    id: int
    run_id: int
    business: Business
    item_id: str
    name: str
    unit: str
    supplier: str
    current_stock: int
    lead_time_days: int
    moq: int
    unit_cost_rm: float
    forecast_7d: float
    forecast_low: float
    forecast_high: float
    days_of_cover: float
    suggested_qty: int
    flag: Flag
    action: str
    reason: str
    reason_source: Literal["llm", "template"]
    # Steps for "Show the calculation", in display order: label -> worked value.
    calc: dict[str, Union[str, float, int]]
    last_8_weeks: list[int]
    status: RecStatus
    decided_by: Optional[str] = None


class POLine(BaseModel):
    item_id: str
    name: str
    qty: int
    unit: str
    unit_cost_rm: float


class PO(BaseModel):
    id: int
    number: str
    business: Business
    supplier: str
    supplier_phone: str
    lines: list[POLine]
    total_rm: float
    approved_by: str
    created_at: str
    whatsapp_text: str
    whatsapp_url: str


class LogEntry(BaseModel):
    id: int
    ts: str
    actor: str
    role: str
    action: LogAction
    item: str
    before: Scalar
    after: Scalar
    reason: str
    business: Business
    hash: str


class Item(BaseModel):
    item_id: str
    name: str
    category: str
    unit: str
    unit_cost_rm: float
    supplier: str
    supplier_phone: str
    lead_time_days: int
    moq: int
    current_stock: int
    perishable: bool
    shelf_life_days: Optional[int] = None
    last_8_weeks: list[int]


# ---------- endpoint bodies and results ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user: User


class OkResponse(BaseModel):
    ok: bool


class RunCheckRequest(BaseModel):
    business: Business


class RunCheckResult(BaseModel):
    run_id: int
    recommendations: list[Rec]


class ApproveRequest(BaseModel):
    # Leave out to approve the suggested quantity; a different number is an edit.
    qty: Optional[int] = Field(default=None, ge=0)


class ApproveResult(BaseModel):
    po_id: Optional[int]  # None when the approved quantity is 0 ("pause reordering")


class RejectRequest(BaseModel):
    reason: str = Field(min_length=1)


class ItemPatch(BaseModel):
    lead_time_days: Optional[int] = Field(default=None, ge=1)
    moq: Optional[int] = Field(default=None, ge=1)


class VerifyResult(BaseModel):
    ok: bool
    entries: int
    broken_at: Optional[int]


class Accuracy(BaseModel):
    model_wape: float
    baseline_wape: float
    weeks_tested: int


class SalesRow(BaseModel):
    date: str
    item_id: str
    qty_sold: int
    price_rm: float


class ConnectResult(BaseModel):
    rows: int
    low_stock_triggered: list[str]
