#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

DATABASE_URL="$(node ./scripts/normalize-database-url.mjs)"
export DATABASE_URL

sh ./scripts/migrate-deploy.sh
exec npm run start
