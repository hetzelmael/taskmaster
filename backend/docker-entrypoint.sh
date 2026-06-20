#!/bin/sh
set -e

MAX_RETRIES=15
RETRY_INTERVAL=3
attempt=1

echo "[entrypoint] Waiting for database to be available..."
while [ $attempt -le $MAX_RETRIES ]; do
  if npm run db:migrate 2>/dev/null; then
    echo "[entrypoint] Migrations completed successfully."
    break
  fi
  echo "[entrypoint] Database not ready (attempt $attempt/$MAX_RETRIES). Retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
  attempt=$((attempt + 1))
done

if [ $attempt -gt $MAX_RETRIES ]; then
  echo "[entrypoint] ERROR: Database not available after $MAX_RETRIES attempts. Exiting."
  exit 1
fi

echo "[entrypoint] Starting server..."
exec node src/app.js
