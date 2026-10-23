"""Module responsible for measuring the calibrated detector on held-out samples."""

from dataclasses import asdict, dataclass

from nilik.domain.models import Decision
from nilik.vision.analyzer import SurfaceAnalyzer
from nilik.vision.synthetic import generate_evaluation_set


@dataclass(frozen=True)
class EvaluationReport:
    sample_count: int
    true_positive: int
    true_negative: int
    false_positive: int
    false_negative: int
    precision: float
    recall: float
    f1: float
    decision_accuracy: float

    def to_dict(self) -> dict[str, int | float]:
        return asdict(self)


def evaluate(analyzer: SurfaceAnalyzer, count_per_class: int = 12) -> EvaluationReport:
    """Evaluate anomaly detection against deterministic synthetic ground truth."""
    tp = tn = fp = fn = 0
    samples = generate_evaluation_set(count_per_class, analyzer.artifact.image_size)
    for sample in samples:
        result = analyzer.inspect(sample.name, sample.pixels)
        predicted_anomaly = result.decision is not Decision.PASS
        has_anomaly = sample.defect_type is not None
        if predicted_anomaly and has_anomaly:
            tp += 1
        elif not predicted_anomaly and not has_anomaly:
            tn += 1
        elif predicted_anomaly:
            fp += 1
        else:
            fn += 1
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return EvaluationReport(
        sample_count=len(samples),
        true_positive=tp,
        true_negative=tn,
        false_positive=fp,
        false_negative=fn,
        precision=round(precision, 3),
        recall=round(recall, 3),
        f1=round(f1, 3),
        decision_accuracy=round((tp + tn) / len(samples), 3),
    )
