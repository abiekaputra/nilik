"""Module responsible for verifying the public HTTP inspection contract."""

from pathlib import Path

from fastapi.testclient import TestClient

from nilik.api.app import create_app
from nilik.config import Settings


def build_client(tmp_path: Path) -> TestClient:
    settings = Settings(
        root=tmp_path,
        database_path=tmp_path / "runtime" / "nilik.db",
        artifact_path=tmp_path / "artifacts" / "surface-v1.json",
    )
    return TestClient(create_app(settings))


def test_health_and_model_metadata_are_available(tmp_path: Path) -> None:
    client = build_client(tmp_path)
    assert client.get("/api/health").json() == {"status": "ok", "version": "1.0.0"}
    model = client.get("/api/model").json()
    assert model["version"] == "surface-v1"
    assert model["reference_count"] == 48


def test_demo_sample_completes_http_product_flow(tmp_path: Path) -> None:
    client = build_client(tmp_path)
    samples = client.get("/api/samples").json()

    response = client.post(
        "/api/inspections",
        json={"sample_name": samples[1]["name"], "pixels": samples[1]["pixels"]},
    )

    assert response.status_code == 201
    assert response.json()["decision"] in {"REVIEW", "FAIL"}
    assert client.get("/api/inspections").json()[0]["sample_name"] == samples[1]["name"]


def test_malformed_image_is_rejected_without_history_record(tmp_path: Path) -> None:
    client = build_client(tmp_path)
    response = client.post(
        "/api/inspections",
        json={"sample_name": "invalid", "pixels": [[0.5]]},
    )
    assert response.status_code == 422
    assert "64x64" in response.json()["detail"]
    assert client.get("/api/inspections").json() == []
