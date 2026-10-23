#!/usr/bin/env bash
# Module responsible for preparing a reproducible local Nilik workstation.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
export UV_CACHE_DIR="${UV_CACHE_DIR:-$ROOT_DIR/.uv-cache}"

if [[ ! -x .venv/bin/python ]]; then
  uv venv --python 3.12 .venv
fi

uv pip install --python .venv/bin/python -e '.[dev]'
pnpm install
.venv/bin/python -m nilik.cli.calibrate
echo "Nilik is ready. Run: pnpm dev"
