"""Every endpoint in docs/CONTRACT.md.

STEP 2: these are stubs that return hard-coded sample data in the exact shapes,
so the web app can switch to the real API early. Later steps replace the bodies.
"""

from typing import Union

from fastapi import APIRouter, File, Header, UploadFile

from src.api import samples
from src.api.schemas import (
    Accuracy,
    ApproveRequest,
    ApproveResult,
    Business,
    ConnectResult,
    Item,
    ItemPatch,
    LogEntry,
    LoginRequest,
    OkResponse,
    PO,
    Rec,
    RejectRequest,
    RunCheckRequest,
    RunCheckResult,
    UserResponse,
    VerifyResult,
)

router = APIRouter(prefix="/api")
connect_router = APIRouter(prefix="/connect/v1", tags=["connect"])


# ---------- session (real versions come from M5) ----------

@router.post("/login", response_model=UserResponse, tags=["auth"])
def login(body: LoginRequest):
    return {"user": samples.SAMPLE_USER}


@router.post("/logout", response_model=OkResponse, tags=["auth"])
def logout():
    return {"ok": True}


@router.get("/me", response_model=UserResponse, tags=["auth"])
def me():
    return {"user": samples.SAMPLE_USER}


# ---------- weekly check ----------

@router.post("/run-check", response_model=RunCheckResult, tags=["recommendations"])
def run_check(body: RunCheckRequest):
    return {"run_id": 1, "recommendations": samples.SAMPLE_RECS}


@router.get("/recommendations", response_model=list[Rec], tags=["recommendations"])
def list_recommendations(business: Business):
    return samples.SAMPLE_RECS


@router.post("/recommendations/{rec_id}/approve", response_model=ApproveResult, tags=["recommendations"])
def approve(rec_id: int, body: ApproveRequest):
    return {"po_id": 1}


@router.post("/recommendations/{rec_id}/reject", response_model=OkResponse, tags=["recommendations"])
def reject(rec_id: int, body: RejectRequest):
    return {"ok": True}


# ---------- purchase orders ----------

@router.get("/purchase-orders", response_model=list[PO], tags=["purchase orders"])
def list_purchase_orders(business: Business):
    return [samples.SAMPLE_PO]


@router.get("/purchase-orders/{po_id}", response_model=PO, tags=["purchase orders"])
def get_purchase_order(po_id: int):
    return samples.SAMPLE_PO


# ---------- items ----------

@router.get("/items", response_model=list[Item], tags=["items"])
def list_items(business: Business):
    return samples.SAMPLE_ITEMS


@router.patch("/items/{item_id}", response_model=Item, tags=["items"])
def update_item(item_id: str, body: ItemPatch):
    return {**samples.SAMPLE_ITEMS[0], **body.model_dump(exclude_none=True)}


# ---------- activity log and accuracy ----------

@router.get("/log", response_model=list[LogEntry], tags=["log"])
def list_log(business: Business):
    return samples.SAMPLE_LOG


@router.get("/log/verify", response_model=VerifyResult, tags=["log"])
def verify_log():
    return samples.SAMPLE_VERIFY


@router.get("/accuracy", response_model=Accuracy, tags=["forecast"])
def accuracy(business: Business):
    return samples.SAMPLE_ACCURACY


# ---------- Orbyte Connect ingest ----------

@connect_router.post("/{business}/sales", response_model=ConnectResult)
def ingest_sales(
    business: Business,
    file: Union[UploadFile, None] = File(default=None),
    x_api_key: Union[str, None] = Header(default=None),
):
    return {"rows": 0, "low_stock_triggered": []}

