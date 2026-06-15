#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# PATH SETUP
# ─────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
HEXSTRIKE_SERVER_DIR="$ROOT_DIR/../hexstrike-server"

pgids=()
cleaned_up=false

# ─────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────

check_file() {
  [[ -f "$1" ]] || {
    echo "Missing required file: $1" >&2
    exit 1
  }
}

kill_port_user() {
  local name="$1"
  local port="$2"

  echo "Checking $name on port $port..."

  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  elif command -v ss >/dev/null 2>&1; then
    pids=$(ss -ltnp "sport = :$port" 2>/dev/null \
      | awk -F'pid=' '/pid=/{split($2,a,","); print a[1]}' \
      | sort -u)
  fi

  if [[ -n "${pids:-}" ]]; then
    echo "Killing existing $name processes on port $port: $pids"
    kill -TERM $pids 2>/dev/null || true
    sleep 1
    kill -KILL $pids 2>/dev/null || true
  else
    echo "No existing process on port $port"
  fi
}

cleanup() {
  if [[ "$cleaned_up" == true ]]; then
    return
  fi
  cleaned_up=true

  echo
  echo "Stopping services..."

  for pgid in "${pgids[@]:-}"; do
    kill -TERM -- "-$pgid" 2>/dev/null || true
  done

  sleep 1

  for pgid in "${pgids[@]:-}"; do
    kill -KILL -- "-$pgid" 2>/dev/null || true
  done

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

  setsid bash -c '
    cd "$1"
    shift
    exec "$@"
  ' _ "$dir" "$@" \
    > >(sed -u "s/^/[$name] /") \
    2>&1 &

  local pid=$!
  pgids+=("$pid")
}

# ─────────────────────────────────────────────
# TRAPS
# ─────────────────────────────────────────────
trap handle_signal INT TERM
trap cleanup EXIT

# ─────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────

check_file "$BACKEND_DIR/venv/bin/activate"
check_file "$BACKEND_DIR/run.py"
check_file "$HEXSTRIKE_SERVER_DIR/venv/bin/activate"
check_file "$HEXSTRIKE_SERVER_DIR/hexstrike_server.py"
check_file "$FRONTEND_DIR/package.json"

# ─────────────────────────────────────────────
# AUTO-FREE PORTS (SELF-HEALING)
# ─────────────────────────────────────────────

kill_port_user "backend" 8000
kill_port_user "hexstrike-server" 8888
kill_port_user "frontend" 5173

sleep 1

# ─────────────────────────────────────────────
# DB INIT
# ─────────────────────────────────────────────

if [[ ! -f "$BACKEND_DIR/hexstrike.db" ]]; then
  echo "Initializing backend database..."
  (
    cd "$BACKEND_DIR"
    source venv/bin/activate
    python -c "from app.database import init_db; init_db()"
  )
fi

# ─────────────────────────────────────────────
# START SERVICES
# ─────────────────────────────────────────────

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
echo "All services started. Press Ctrl+C to stop."

# Wait for any service to exit unexpectedly
wait -n "${pgids[@]}" || true