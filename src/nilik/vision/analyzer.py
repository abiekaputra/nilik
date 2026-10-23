"""Module responsible for converting image signals into inspection decisions."""

from collections import deque

import numpy as np

from nilik.domain.models import Decision, InspectionResult, Region
from nilik.vision.artifact import CalibrationArtifact, anomaly_signal


class SurfaceAnalyzer:
    """Inspect normalized grayscale surfaces with a calibrated anomaly boundary."""

    def __init__(self, artifact: CalibrationArtifact) -> None:
        self.artifact = artifact

    def inspect(self, sample_name: str, pixels: list[list[float]] | np.ndarray) -> InspectionResult:
        image = np.asarray(pixels, dtype=np.float64)
        self._validate(image)
        image = np.clip(image, 0, 1)
        signal = anomaly_signal(image)
        ratio = signal / max(self.artifact.signal_threshold, 1e-9)
        score = float(np.quantile(ratio, 0.997))
        regions = self._find_regions(ratio >= self.artifact.review_ratio, ratio)
        decision = self._decide(score, regions)
        return InspectionResult(
            sample_name=sample_name.strip(),
            decision=decision,
            anomaly_score=round(score, 3),
            threshold=self.artifact.review_ratio,
            regions=tuple(regions),
            heatmap=tuple(tuple(round(float(value), 3) for value in row) for row in ratio),
            explanation=self._explain(decision, len(regions)),
        )

    def _validate(self, image: np.ndarray) -> None:
        if image.ndim != 2:
            raise ValueError("Pixels must be a two-dimensional grayscale matrix")
        if image.shape != (self.artifact.image_size, self.artifact.image_size):
            size = self.artifact.image_size
            raise ValueError(f"Pixels must have shape {size}x{size}")
        if not np.isfinite(image).all():
            raise ValueError("Pixels must contain finite values")

    def _decide(self, score: float, regions: list[Region]) -> Decision:
        if score >= self.artifact.fail_ratio and regions:
            return Decision.FAIL
        if score >= self.artifact.review_ratio or regions:
            return Decision.REVIEW
        return Decision.PASS

    def _find_regions(self, mask: np.ndarray, ratio: np.ndarray) -> list[Region]:
        visited = np.zeros_like(mask, dtype=bool)
        regions: list[Region] = []
        height, width = mask.shape
        for y, x in zip(*np.where(mask), strict=True):
            if visited[y, x]:
                continue
            points = self._flood(mask, visited, int(x), int(y), width, height)
            if len(points) < 3:
                continue
            xs, ys = zip(*points, strict=True)
            severity = max(float(ratio[py, px]) for px, py in points)
            regions.append(
                Region(
                    x=min(xs),
                    y=min(ys),
                    width=max(xs) - min(xs) + 1,
                    height=max(ys) - min(ys) + 1,
                    severity=round(severity, 3),
                )
            )
        return sorted(regions, key=lambda region: region.severity, reverse=True)[:8]

    @staticmethod
    def _flood(
        mask: np.ndarray,
        visited: np.ndarray,
        start_x: int,
        start_y: int,
        width: int,
        height: int,
    ) -> list[tuple[int, int]]:
        queue = deque([(start_x, start_y)])
        visited[start_y, start_x] = True
        points: list[tuple[int, int]] = []
        while queue:
            x, y = queue.popleft()
            points.append((x, y))
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((nx, ny))
        return points

    @staticmethod
    def _explain(decision: Decision, region_count: int) -> str:
        if decision is Decision.PASS:
            return "No connected anomaly exceeded the calibrated review boundary."
        if decision is Decision.REVIEW:
            return f"{region_count} region(s) need an operator decision before release."
        return f"{region_count} high-severity region(s) exceeded the rejection boundary."
