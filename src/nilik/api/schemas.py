"""Module responsible for validating Nilik API contracts."""

from pydantic import BaseModel, Field, field_validator


class InspectionRequest(BaseModel):
    sample_name: str = Field(min_length=1, max_length=80)
    pixels: list[list[float]]

    @field_validator("sample_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Sample name cannot be blank")
        return value.strip()


class RegionResponse(BaseModel):
    x: int
    y: int
    width: int
    height: int
    severity: float


class InspectionResponse(BaseModel):
    id: int
    sample_name: str
    decision: str
    anomaly_score: float
    threshold: float
    regions: list[RegionResponse]
    heatmap: list[list[float]]
    explanation: str
