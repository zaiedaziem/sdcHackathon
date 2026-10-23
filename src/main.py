"""Restock Autopilot API (M3).

Start it with:  uvicorn src.main:app --reload --port 8000
Interactive docs: http://localhost:8000/docs
The built web app (cd src/web && npm run build) is served at / from the same URL.
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.api.routes import connect_router, router

WEB_DIST = Path(__file__).parent / "web" / "dist"

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


app.include_router(router)
app.include_router(connect_router)


def add_web_app(app: FastAPI, dist: Path) -> None:
    """Serve the React build at /. Call this after the API routers.

    The web app uses browser routing, so a refresh on /orders asks the server
    for /orders. Any path that is not a real file gets index.html, and React
    picks the page. Paths under /api and /connect stay real 404s.
    """
    dist = dist.resolve()
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def web_app(path: str):
        if path.split("/")[0] in ("api", "connect"):
            raise HTTPException(status_code=404, detail="Not found")
        file = (dist / path).resolve()
        # is_relative_to stops "../" paths from reading files outside dist/.
        if path and file.is_file() and file.is_relative_to(dist):
            return FileResponse(file)
        return FileResponse(dist / "index.html")


# Skipped when the UI hasn't been built yet, so the API still runs on its own.
if (WEB_DIST / "index.html").is_file():
    add_web_app(app, WEB_DIST)
