#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/.halflife.pid"
cd "$PROJECT_DIR"

if [[ -f "$PID_FILE" ]]; then
  APP_PID="$(cat "$PID_FILE")"
  if kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID"
    for _ in $(seq 1 10); do
      if ! kill -0 "$APP_PID" 2>/dev/null; then
        break
      fi
      sleep 1
    done
    echo "HalfLife app stopped."
  else
    echo "HalfLife app was not running; removed stale PID file."
  fi
  rm -f "$PID_FILE"
else
  echo "No HalfLife app PID file found."
fi

if [[ "${1:-}" == "--with-db" ]]; then
  docker compose stop postgres
  echo "PostgreSQL stopped. Data is preserved."
else
  echo "PostgreSQL is still running. Use ./stop.sh --with-db to stop it too."
fi
