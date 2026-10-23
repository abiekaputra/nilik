"""Module responsible for verifying durable inspection history behavior."""

from pathlib import Path

from nilik.storage.repository import InspectionRepository
from nilik.vision.analyzer import SurfaceAnalyzer
from nilik.vision.artifact import calibrate
from nilik.vision.synthetic import generate_surface


def test_repository_saves_and_lists_recent_results(tmp_path: Path) -> None:
    repository = InspectionRepository(tmp_path / "history.db")
    repository.initialize()
    sample = generate_surface(82, "scratch")
    result = SurfaceAnalyzer(calibrate(reference_count=16)).inspect(sample.name, sample.pixels)

    identifier = repository.save(result)
    records = repository.recent()

    assert identifier == 1
    assert records[0]["sample_name"] == sample.name
    assert records[0]["region_count"] >= 1


def test_repository_clamps_requested_history_limit(tmp_path: Path) -> None:
    repository = InspectionRepository(tmp_path / "history.db")
    repository.initialize()
    assert repository.recent(0) == []
