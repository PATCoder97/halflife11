#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

DB_URL="$(node ./scripts/normalize-database-url.mjs)"

psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "_prisma_migrations_migration_name_key" ON "_prisma_migrations"("migration_name");
SQL

for migration_dir in prisma/migrations/*; do
  [ -d "$migration_dir" ] || continue

  migration_name="$(basename "$migration_dir")"
  migration_file="$migration_dir/migration.sql"

  if [ ! -f "$migration_file" ]; then
    continue
  fi

  applied="$(psql "$DB_URL" -tAc "SELECT 1 FROM \"_prisma_migrations\" WHERE \"migration_name\" = '$migration_name' AND \"rolled_back_at\" IS NULL LIMIT 1")"
  if [ "$applied" = "1" ]; then
    echo "Migration already applied: $migration_name"
    continue
  fi

  echo "Applying migration: $migration_name"
  checksum="$(sha256sum "$migration_file" | awk '{print $1}')"
  migration_id="$(cat /proc/sys/kernel/random/uuid)"

  psql "$DB_URL" -v ON_ERROR_STOP=1 \
    -v migration_id="$migration_id" \
    -v checksum="$checksum" \
    -v migration_name="$migration_name" <<SQL
BEGIN;
\\i $migration_file
INSERT INTO "_prisma_migrations" (
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "logs",
  "rolled_back_at",
  "started_at",
  "applied_steps_count"
) VALUES (
  :'migration_id',
  :'checksum',
  now(),
  :'migration_name',
  NULL,
  NULL,
  now(),
  1
);
COMMIT;
SQL
done

echo "All migrations have been successfully applied."
