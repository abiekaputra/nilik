"""Module responsible for verifying the end-to-end inspection service."""

from pathlib import Path

import pytest

from nilik.services.inspection import InspectionService
from nilik.storage.repository import InspectionRepository
from nilik.vision.analyzer import SurfaceAnalyzer
from nilik.vision.artifact import calibrate


@pytest.fixture()
def service(tmp_path: Path) -> InspectionService:
    repository = InspectionRepository(tmp_path / "nilik.db")
    repository.initialize()
    return InspectionService(SurfaceAnalyzer(calibrate(reference_count=16)), repository)


def test_demo_sample_can_be_inspected_and_persisted(service: InspectionService) -> None:
    sample = service.demo_samples()[1]
    identifier, result = service.inspect(str(sample["name"]), sample["pixels"])
    assert identifier == 1
    assert result.sample_name == sample["name"]
    assert service.repository.recent()[0]["decision"] == result.decision.value


def test_blank_sample_name_is_rejected(service: InspectionService) -> None:
    sample = service.demo_samples()[0]
    with pytest.raises(ValueError, match="required"):
        service.inspect("  ", sample["pixels"])


def test_artifact_summary_exposes_supported_defects(service: InspectionService) -> None:
    summary = service.artifact_summary()
    assert summary["version"] == "surface-v1"
    assert summary["supported_defects"] == ["scratch", "contamination", "edge-chip"]
