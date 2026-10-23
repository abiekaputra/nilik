# Quality and Evaluation

## Reproducible evaluation

`pnpm evaluate` creates a held-out set with 12 reference surfaces and 36
anomalies split evenly across scratches, contamination, and edge chips. The
seeds do not overlap the calibration references.

Current deterministic baseline:

| Metric            | Result |
| ----------------- | -----: |
| Samples           |     48 |
| Precision         |  1.000 |
| Recall            |  1.000 |
| F1                |  1.000 |
| Decision accuracy |  1.000 |

The release gate requires F1 >= 0.90. These metrics describe the controlled
synthetic benchmark only and are not evidence of production accuracy.

## Automated checks

- Python unit tests cover pass, anomaly, malformed dimensions, non-finite data,
  persistence, and application service behavior.
- Browser client tests cover response parsing, request serialization, and API
  failure details.
- Ruff, Oxlint, TypeScript, and Prettier protect consistency.
- A source-length guard enforces 400 lines for Python production files, 300
  lines for other production files, and 1,000 lines for tests.
- The production web bundle is built as part of the quality gate.
