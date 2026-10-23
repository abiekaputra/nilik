"""Module responsible for calibrating and persisting inspection thresholds."""

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

from nilik.vision.synthetic import generate_surface


@dataclass(frozen=True)
class CalibrationArtifact:
    version: str
    image_size: int
    signal_center: float
    signal_threshold: float
    review_ratio: float
    fail_ratio: float
    reference_count: int
    seed: int

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(asdict(self), indent=2) + "\n", encoding="utf-8")

    @classmethod
    def load(cls, path: Path) -> "CalibrationArtifact":
        return cls(**json.loads(path.read_text(encoding="utf-8")))


def box_blur(image: np.ndarray, radius: int = 3) -> np.ndarray:
    """Apply a dependency-free reflected box blur."""
    width = radius * 2 + 1
    padded = np.pad(image, radius, mode="reflect")
    windows = np.lib.stride_tricks.sliding_window_view(padded, (width, width))
    return windows.mean(axis=(-2, -1))


def anomaly_signal(image: np.ndarray) -> np.ndarray:
    """Combine local contrast and gradient discontinuity into one signal."""
    background = box_blur(image, radius=3)
    residual = np.abs(image - background)
    gradient_y, gradient_x = np.gradient(image)
    gradient = np.hypot(gradient_x, gradient_y)
    return residual * 0.72 + gradient * 0.28


def calibrate(seed: int = 42, reference_count: int = 48, size: int = 64) -> CalibrationArtifact:
    """Fit robust signal boundaries exclusively from known-good references."""
    signals = [
        anomaly_signal(generate_surface(seed + index, size=size).pixels).ravel()
        for index in range(reference_count)
    ]
    combined = np.concatenate(signals)
    center = float(np.quantile(combined, 0.90))
    threshold = float(np.quantile(combined, 0.9995))
    return CalibrationArtifact(
        version="surface-v1",
        image_size=size,
        signal_center=center,
        signal_threshold=threshold,
        review_ratio=1.0,
        fail_ratio=1.38,
        reference_count=reference_count,
        seed=seed,
    )
