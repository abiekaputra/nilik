"""Module responsible for exposing Nilik through a guarded HTTP API."""

from dataclasses import asdict

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from nilik import __version__
from nilik.api.dependencies import build_service
from nilik.api.schemas import InspectionRequest, InspectionResponse
from nilik.config import Settings
from nilik.services.inspection import InspectionService


def create_app(settings: Settings | None = None) -> FastAPI:
    service = build_service(settings or Settings.local())
    app = FastAPI(
        title="Nilik Inspection API",
        version=__version__,
        description="Local visual anomaly inspection with reproducible calibration.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:4610", "http://localhost:4610"],
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    register_routes(app, service)
    return app


def register_routes(app: FastAPI, service: InspectionService) -> None:
    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    @app.get("/api/model")
    def model() -> dict[str, object]:
        return service.artifact_summary()

    @app.get("/api/samples")
    def samples() -> list[dict[str, object]]:
        return service.demo_samples()

    @app.get("/api/inspections")
    def history(limit: int = Query(default=20, ge=1, le=100)) -> list[dict[str, object]]:
        return service.repository.recent(limit)

    @app.post("/api/inspections", response_model=InspectionResponse, status_code=201)
    def inspect(payload: InspectionRequest) -> dict[str, object]:
        try:
            inspection_id, result = service.inspect(payload.sample_name, payload.pixels)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        response = asdict(result)
        response["id"] = inspection_id
        response["decision"] = result.decision.value
        return response


app = create_app()
