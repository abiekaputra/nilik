"""Module responsible for printing the held-out synthetic evaluation report."""

import json

from nilik.api.dependencies import build_service
from nilik.config import Settings
from nilik.vision.evaluation import evaluate


def main() -> None:
    service = build_service(Settings.local())
    report = evaluate(service.analyzer)
    print(json.dumps(report.to_dict(), indent=2))
    if report.f1 < 0.9:
        raise SystemExit("Evaluation gate failed: F1 must be at least 0.90")


if __name__ == "__main__":
    main()
