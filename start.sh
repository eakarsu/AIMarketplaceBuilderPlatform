#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
require_file() { [ -f "$1" ] || { echo "Missing required file: $1" >&2; exit 1; }; }
require_file .env
set -a
source ./.env
set +a
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
CHILD_PIDS=()

require_dir() { [ -d "$1" ] || { echo "Missing dependencies: $1 (install explicitly before startup)" >&2; exit 1; }; }
port_free() {
  if command -v lsof >/dev/null 2>&1 && lsof -ti ":$1" >/dev/null 2>&1; then
    echo "Port $1 is already in use; refusing to terminate another process." >&2
    exit 1
  fi
}
cleanup() { for pid in "${CHILD_PIDS[@]:-}"; do [ -n "$pid" ] && kill "$pid" 2>/dev/null || true; done; }
trap cleanup INT TERM EXIT

require_dir "$PROJECT_DIR/server/node_modules"
require_dir "$PROJECT_DIR/client/node_modules"
port_free "$BACKEND_PORT"
port_free "$FRONTEND_PORT"

if [[ "${ALLOW_SCHEMA_MIGRATION:-false}" == "true" ]]; then
  node server/scripts/provisionRuntimeAdmin.js
fi

(cd "$PROJECT_DIR/server" && PORT="$BACKEND_PORT" node index.js) &
CHILD_PIDS+=("$!")
(cd "$PROJECT_DIR/client" && PORT="$FRONTEND_PORT" BROWSER=none CI=true REACT_APP_API_ORIGIN="http://127.0.0.1:$BACKEND_PORT" npm start) &
CHILD_PIDS+=("$!")

echo "Marketplace services started without installing, seeding, or reclaiming ports."
wait "${CHILD_PIDS[@]}"
