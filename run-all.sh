#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
HEXSTRIKE_SERVER_DIR="$ROOT_DIR/../hexstrike-server"

# Store service process group IDs. Each one starts as the PID of the
# service session leader, but cleanup targets the group even if that
# leader exits before one of its children.
pgids=()
cleaned_up=false

check_file() {
  local path="$1"

  if [[ ! -f "$path" ]]; then
    echo "Missing required file: $path" >&2
    exit 1
  fi
}

check_port_free() {
  local name="$1"
  local port="$2"

  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "sport = :$port" 2>/dev/null | tail -n +2 | grep -q .; then
      echo "$name port $port is already in use." >&2
      echo "Stop the existing process, then run this script again." >&2
      exit 1
    fi
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$name port $port is already in use." >&2
      echo "Stop the existing process, then run this script again." >&2
      exit 1
    fi
  fi
}

cleanup() {
  # Prevent cleanup from running twice (INT + EXIT)
  if [[ "$cleaned_up" == true ]]; then
    return
  fi
  cleaned_up=true

  echo
  echo "Stopping services..."

  # Gracefully terminate entire service process groups.
  for pgid in "${pgids[@]:-}"; do
    if kill -0 -- "-$pgid" 2>/dev/null; then
      kill -TERM -- "-$pgid" 2>/dev/null || true
    fi
  done

  # Give processes a short moment to exit cleanly
  sleep 1

  # Force kill any remaining processes
  for pgid in "${pgids[@]:-}"; do
    if kill -0 -- "-$pgid" 2>/dev/null; then
      kill -KILL -- "-$pgid" 2>/dev/null || true
    fi
  done

  # Reap only the service session leaders. Avoid a bare wait here because
  # process-substitution loggers are also shell children on some bash versions.
  for pgid in "${pgids[@]:-}"; do
    wait "$pgid" 2>/dev/null || true
  done
}

handle_signal() {
  cleanup
  exit 130
}

start_service() {
  local name="$1"
  local dir="$2"
  shift 2

  echo "Starting $name..."

  # Start the service in a new session/process group so we can kill the
  # service and all of its children together. Keep sed outside that group:
  # it will exit as soon as the service closes its stdout/stderr.
  setsid bash -c '
    cd "$1"
    shift
    exec "$@"
  ' _ "$dir" "$@" > >(sed -u "s/^/[$name] /") 2>&1 &

  local pid=$!
  pgids+=("$pid")
}

trap handle_signal INT TERM
trap cleanup EXIT

# Validate required files
check_file "$BACKEND_DIR/venv/bin/activate"
check_file "$BACKEND_DIR/run.py"
check_file "$HEXSTRIKE_SERVER_DIR/venv/bin/activate"
check_file "$HEXSTRIKE_SERVER_DIR/hexstrike_server.py"
check_file "$FRONTEND_DIR/package.json"

# Validate expected ports before starting anything.
check_port_free "backend" 8000
check_port_free "hexstrike-server" 8888
check_port_free "frontend" 5173

# Initialize database if it doesn't exist
if [[ ! -f "$BACKEND_DIR/hexstrike.db" ]]; then
  echo "Initializing backend database..."
  (
    cd "$BACKEND_DIR"
    source venv/bin/activate
    python -c "from app.database import init_db; init_db()"
  )
fi

# Start services
start_service \
  "backend" \
  "$BACKEND_DIR" \
  bash -lc "source venv/bin/activate && python run.py"

start_service \
  "hexstrike-server" \
  "$HEXSTRIKE_SERVER_DIR" \
  bash -lc "source venv/bin/activate && python hexstrike_server.py"

start_service \
  "frontend" \
  "$FRONTEND_DIR" \
  npm run dev -- --host 0.0.0.0 --port 5173

echo
echo "All services started. Press Ctrl+C to stop them."

# Exit if any service stops unexpectedly
wait -n "${pgids[@]}"
