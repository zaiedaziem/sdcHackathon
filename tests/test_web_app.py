"""The built web app is served at / next to the API (src/main.py add_web_app)."""

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.main import add_web_app


def make_client(tmp_path):
    # A tiny fake dist/ folder, so the test doesn't need `npm run build`.
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<div id='root'></div>")
    (dist / "favicon.svg").write_text("<svg></svg>")
    (dist / "assets" / "app.js").write_text("console.log('hi')")
    (tmp_path / "secret.txt").write_text("do not serve")

    app = FastAPI()

    @app.get("/api/health")
    def health():
        return {"ok": True}

    add_web_app(app, dist)
    return TestClient(app)


def test_root_serves_index(tmp_path):
    r = make_client(tmp_path).get("/")
    assert r.status_code == 200
    assert "root" in r.text


def test_deep_link_serves_index(tmp_path):
    # Refreshing the browser on /orders must still load the React app.
    r = make_client(tmp_path).get("/orders")
    assert r.status_code == 200
    assert "root" in r.text


def test_static_files(tmp_path):
    client = make_client(tmp_path)
    assert client.get("/assets/app.js").text == "console.log('hi')"
    assert client.get("/favicon.svg").text == "<svg></svg>"


def test_api_routes_still_win(tmp_path):
    client = make_client(tmp_path)
    assert client.get("/api/health").json() == {"ok": True}
    r = client.get("/api/not-a-route")
    assert r.status_code == 404
    assert r.json() == {"detail": "Not found"}


def test_no_files_outside_dist(tmp_path):
    r = make_client(tmp_path).get("/..%2Fsecret.txt")
    assert "do not serve" not in r.text
