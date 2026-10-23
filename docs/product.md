# Product Definition

## The inspection gap

Small production teams often begin visual quality control with a person, a
camera, and a spreadsheet. The human decision is useful, but the evidence is
easy to lose and the threshold can drift between operators.

Nilik is a local inspection workstation for that transition point. It accepts
one surface image, makes a calibrated recommendation, exposes the regions that
influenced the result, and records the inspection for review.

## Primary user

The primary user is a quality operator who needs to triage a surface as
`PASS`, `REVIEW`, or `FAIL`. A quality engineer can inspect the score, regions,
and history before changing a threshold or approving a production trial.

## Release flow

1. Select a controlled demo sample or upload an image.
2. Normalize the image to the active 64 × 64 grayscale profile.
3. Run the calibrated local analyzer.
4. Review the anomaly heatmap, regions, score, and explanation.
5. Persist the result in SQLite for traceability.

## Acceptance criteria

- A new clone can be prepared with `pnpm setup`.
- The API and web console start together with `pnpm dev`.
- Reference and anomaly samples complete the same browser flow.
- Invalid image matrices are rejected before persistence.
- Evaluation is deterministic and fails below the documented F1 gate.
- The UI remains usable at desktop and mobile widths.

## Current boundary

Version 1.0 is a portfolio-grade local release. Its calibration and reported
metrics use procedurally generated surfaces. A real deployment would require a
representative factory dataset, camera and lighting controls, validation by a
quality engineer, drift monitoring, and a production-specific acceptance
threshold.
