# ADR 001: Start with an explainable synthetic baseline

## Status

Accepted for the local portfolio release.

## Context

No confidential production imagery or verified defect dataset is available.
Shipping a pretrained model and presenting its score as factory accuracy would
create a claim that the evidence cannot support.

## Decision

Use deterministic synthetic surfaces, calibration from known-good references,
and an explainable local signal detector. Keep the analyzer behind an
application service so a learned model can replace it later.

## Consequences

The entire flow can be tested and demonstrated without external data. The
benchmark is intentionally limited: production readiness requires real images,
camera controls, domain validation, and threshold recalibration.
