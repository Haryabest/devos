#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd /app/packages/db
npx prisma migrate deploy

echo "Starting: $*"
cd /app/api
exec "$@"
