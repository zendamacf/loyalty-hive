#!/bin/sh
set -eu

echo "Running database migrations..."
bun run db:migrate

echo "Starting server..."
exec bun run start
