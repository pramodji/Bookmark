#!/bin/sh
set -e

# Ensure DB schema exists on the mounted volume
node /app/node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null || true

# WAL checkpoint to flush any pending writes
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => p.\$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE)'))
  .then(() => p.\$disconnect())
  .catch(() => p.\$disconnect());
" 2>/dev/null || true

if [ ! -f "/app/data/.migrated" ]; then
  echo "Migrating data from JSON..."
  node scripts/migrate-json-to-db.js || true
  touch /app/data/.migrated
fi

# Ensure default admin user exists
node scripts/ensure-admin.js

# Migrate settings to per-user (idempotent)
node scripts/migrate-multiuser.js 2>/dev/null || true

exec node server.js
