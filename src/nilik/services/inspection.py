"""Module responsible for coordinating analysis, persistence, and demo samples."""

from dataclasses import asdict

from nilik.domain.models import InspectionResult
from nilik.storage.repository import InspectionRepository
from nilik.vision.analyzer import SurfaceAnalyzer
from nilik.vision.synthetic import DEFECT_TYPES, generate_surface


class InspectionService:
    def __init__(self, analyzer: SurfaceAnalyzer, repository: InspectionRepository) -> None:
        self.analyzer = analyzer
        self.repository = repository

    def inspect(self, sample_name: str, pixels: list[list[float]]) -> tuple[int, InspectionResult]:
        clean_name = sample_name.strip()
        if not clean_name:
            raise ValueError("Sample name is required")
        result = self.analyzer.inspect(clean_name, pixels)
        return self.repository.save(result), result

    def demo_samples(self) -> list[dict[str, object]]:
        definitions: tuple[tuple[int, str | None], ...] = (
            (81, None),
            (102, "scratch"),
            (207, "contamination"),
            (311, "edge-chip"),
        )
        samples = []
        for seed, defect_type in definitions:
            sample = generate_surface(seed, defect_type, self.analyzer.artifact.image_size)
            samples.append(
                {
                    "name": sample.name,
                    "label": (
                        "Reference surface"
                        if defect_type is None
                        else defect_type.replace("-", " ").title()
                    ),
                    "expected": "PASS" if defect_type is None else "ANOMALY",
                    "pixels": sample.pixels.round(4).tolist(),
                }
            )
        return samples

    def artifact_summary(self) -> dict[str, object]:
        payload = asdict(self.analyzer.artifact)
        payload["supported_defects"] = list(DEFECT_TYPES)
        return payload
