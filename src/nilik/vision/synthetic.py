"""Module responsible for generating reproducible surface inspection samples."""

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

FloatImage = NDArray[np.float64]
BoolMask = NDArray[np.bool_]
DEFECT_TYPES = ("scratch", "contamination", "edge-chip")


@dataclass(frozen=True)
class SyntheticSample:
    name: str
    defect_type: str | None
    pixels: FloatImage
    mask: BoolMask


def generate_surface(seed: int, defect_type: str | None = None, size: int = 64) -> SyntheticSample:
    """Generate one textured surface and an optional known anomaly mask."""
    if defect_type not in (*DEFECT_TYPES, None):
        raise ValueError(f"Unsupported defect type: {defect_type}")
    if size < 32:
        raise ValueError("Surface size must be at least 32 pixels")

    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:size, 0:size]
    grain = 0.035 * np.sin(x * 0.55 + seed * 0.1)
    grain += 0.025 * np.cos(y * 0.31 - seed * 0.07)
    illumination = 0.05 * (x / size) - 0.025 * (y / size)
    pixels = 0.52 + grain + illumination + rng.normal(0, 0.012, (size, size))
    mask = np.zeros((size, size), dtype=bool)

    if defect_type == "scratch":
        slope = rng.uniform(-0.55, 0.55)
        center = rng.uniform(size * 0.35, size * 0.65)
        distance = np.abs(y - (slope * x + center)) / np.sqrt(1 + slope**2)
        span = (x > size * 0.18) & (x < size * 0.82)
        mask = (distance < 1.5) & span
        pixels[mask] -= 0.34
    elif defect_type == "contamination":
        cx, cy = rng.uniform(size * 0.3, size * 0.7, 2)
        radius = rng.uniform(size * 0.07, size * 0.12)
        mask = (x - cx) ** 2 + (y - cy) ** 2 < radius**2
        pixels[mask] += 0.28
    elif defect_type == "edge-chip":
        cy = int(rng.uniform(size * 0.28, size * 0.72))
        depth = int(rng.uniform(size * 0.08, size * 0.16))
        mask = (x < depth) & (np.abs(y - cy) < depth * 0.8)
        pixels[mask] = 0.08

    suffix = defect_type or "reference"
    return SyntheticSample(
        name=f"NLK-{seed:04d}-{suffix}",
        defect_type=defect_type,
        pixels=np.clip(pixels, 0, 1),
        mask=mask,
    )


def generate_evaluation_set(count_per_class: int = 12, size: int = 64) -> list[SyntheticSample]:
    """Create a balanced, deterministic set for regression evaluation."""
    samples: list[SyntheticSample] = []
    classes: tuple[str | None, ...] = (None, *DEFECT_TYPES)
    for class_index, defect_type in enumerate(classes):
        for offset in range(count_per_class):
            seed = 1_000 + class_index * 100 + offset
            samples.append(generate_surface(seed, defect_type, size))
    return samples
