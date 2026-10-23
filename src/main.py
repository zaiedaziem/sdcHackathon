"""Restock Autopilot API (M3).

Start it with:  uvicorn src.main:app --reload --port 8000
Interactive docs: http://localhost:8000/docs
"""

from fastapi import FastAPI

app = FastAPI(
    title="Restock Autopilot API",
    description="Orbyte module: weekly reorder recommendations with human approval. "
    "Endpoints follow docs/CONTRACT.md. All data is synthetic.",
    version="0.1.0",
)


@app.get("/api/health", tags=["system"])
def health() -> dict:
    """Quick check that the server is up."""
    return {"ok": True}
