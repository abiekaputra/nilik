"""Module responsible for defining inspection domain values."""

from dataclasses import dataclass
from enum import StrEnum


class Decision(StrEnum):
    PASS = "PASS"
    REVIEW = "REVIEW"
    FAIL = "FAIL"


@dataclass(frozen=True)
class Region:
    x: int
    y: int
    width: int
    height: int
    severity: float


@dataclass(frozen=True)
class InspectionResult:
    sample_name: str
    decision: Decision
    anomaly_score: float
    threshold: float
    regions: tuple[Region, ...]
    heatmap: tuple[tuple[float, ...], ...]
    explanation: str
