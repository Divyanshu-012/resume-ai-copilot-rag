#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [[ ! -d "$ROOT/venv" ]]; then
  python3 -m venv "$ROOT/venv"
fi

"$ROOT/venv/bin/pip" install -r requirements.txt
exec "$ROOT/venv/bin/uvicorn" main:app --reload --host 0.0.0.0 --port 8000
