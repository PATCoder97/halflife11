#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/.halflife.pid"
cd "$PROJECT_DIR"

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and configure it first." >&2
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "HalfLife is already running with PID $EXISTING_PID at http://localhost:3000"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if ss -ltnH 'sport = :3000' | grep -q .; then
  echo "Port 3000 is already used by another process:" >&2
  ss -ltnp 'sport = :3000' >&2 || true
  exit 1
fi

read_env() {
  local key="$1"
  sed -n "s/^${key}=//p" .env | tail -n 1
}

POSTGRES_DB="$(read_env POSTGRES_DB)"
POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_PASSWORD="$(read_env POSTGRES_PASSWORD)"
POSTGRES_PORT="$(read_env POSTGRES_PORT)"

: "${POSTGRES_DB:?POSTGRES_DB is required in .env}"
: "${POSTGRES_USER:?POSTGRES_USER is required in .env}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required in .env}"

POSTGRES_PORT="${POSTGRES_PORT:-5434}"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"

# Local Next.js replaces the Compose app and proxy; PostgreSQL stays in Docker.
docker compose stop app caddy >/dev/null 2>&1 || true
docker compose up -d postgres

POSTGRES_CONTAINER="$(docker compose ps -q postgres)"
for _ in $(seq 1 30); do
  DB_STATUS="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$POSTGRES_CONTAINER")"
  if [[ "$DB_STATUS" == "healthy" ]]; then
    break
  fi
  sleep 1
done

if [[ "${DB_STATUS:-unknown}" != "healthy" ]]; then
  echo "PostgreSQL did not become healthy. Run: docker compose logs postgres" >&2
  exit 1
fi

if [[ ! -x node_modules/.bin/next ]]; then
  npm ci
fi

npm run db:generate
npm run db:migrate:deploy

NEEDS_BUILD=false
if [[ ! -f .next/BUILD_ID ]]; then
  NEEDS_BUILD=true
elif find app components lib prisma -type f -newer .next/BUILD_ID -print -quit | grep -q .; then
  NEEDS_BUILD=true
fi

if [[ "${1:-}" == "--build" || "$NEEDS_BUILD" == "true" ]]; then
  npm run build
fi

echo "HalfLife is starting at http://localhost:3000"
node_modules/.bin/next start &
APP_PID=$!
echo "$APP_PID" > "$PID_FILE"

cleanup() {
  rm -f "$PID_FILE"
  if kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM
wait "$APP_PID"
