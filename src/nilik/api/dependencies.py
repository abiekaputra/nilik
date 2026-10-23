"""Module responsible for constructing the Nilik application service graph."""

from nilik.config import Settings
from nilik.services.inspection import InspectionService
from nilik.storage.repository import InspectionRepository
from nilik.vision.analyzer import SurfaceAnalyzer
from nilik.vision.artifact import CalibrationArtifact, calibrate


def build_service(settings: Settings) -> InspectionService:
    settings.prepare()
    if not settings.artifact_path.exists():
        calibrate().save(settings.artifact_path)
    repository = InspectionRepository(settings.database_path)
    repository.initialize()
    artifact = CalibrationArtifact.load(settings.artifact_path)
    return InspectionService(SurfaceAnalyzer(artifact), repository)
