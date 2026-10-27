#!/bin/sh
# Container entrypoint: apply migrations, seed (create-only, never overwrites existing rows or
# files), then start Next.js.
set -e

# Fresh volumes (Fly.io, Docker) are owned by root: take ownership, then drop privileges.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data
  chown -R nextjs:nodejs /app/data
  exec su-exec nextjs:nodejs sh "$0" "$@"
fi

# Local binaries (prisma runs the seed through `tsx`).
PATH="$(pwd)/node_modules/.bin:$PATH"
export PATH

prisma migrate deploy
if [ "${SEED_ON_START:-true}" = "true" ]; then
  prisma db seed
fi
exec next start -H 0.0.0.0 -p "${PORT:-3000}"
