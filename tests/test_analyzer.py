"""Module responsible for verifying visual analysis decisions and validation."""

import numpy as np
import pytest

from nilik.domain.models import Decision
from nilik.vision.analyzer import SurfaceAnalyzer
from nilik.vision.artifact import calibrate
from nilik.vision.synthetic import generate_surface


@pytest.fixture(scope="module")
def analyzer() -> SurfaceAnalyzer:
    return SurfaceAnalyzer(calibrate(reference_count=24))


def test_reference_surface_passes(analyzer: SurfaceAnalyzer) -> None:
    sample = generate_surface(700)
    result = analyzer.inspect(sample.name, sample.pixels)
    assert result.decision is Decision.PASS
    assert result.regions == ()


@pytest.mark.parametrize("defect_type", ["scratch", "contamination", "edge-chip"])
def test_known_anomaly_is_detected(analyzer: SurfaceAnalyzer, defect_type: str) -> None:
    sample = generate_surface(701, defect_type)
    result = analyzer.inspect(sample.name, sample.pixels)
    assert result.decision in {Decision.REVIEW, Decision.FAIL}
    assert result.anomaly_score >= result.threshold
    assert result.regions


def test_invalid_dimensions_are_rejected(analyzer: SurfaceAnalyzer) -> None:
    with pytest.raises(ValueError, match="shape 64x64"):
        analyzer.inspect("broken", np.zeros((10, 10)))


def test_non_finite_values_are_rejected(analyzer: SurfaceAnalyzer) -> None:
    pixels = np.zeros((64, 64))
    pixels[0, 0] = np.nan
    with pytest.raises(ValueError, match="finite"):
        analyzer.inspect("broken", pixels)
