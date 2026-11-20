#!/bin/sh
# Docker build step (written for this template, MIT).
# The website template prerenders pages with data from Payload. Railway builds
# have no access to the project's private network, so the build runs against a
# throwaway Postgres inside the build container: migrations are applied there,
# Next.js prerenders the empty site, and the database is deleted. At runtime
# pages are regenerated from the real database (on-demand revalidation).
set -eu

PGDATA=/tmp/build-postgres
mkdir -p "$PGDATA" /run/postgresql
chown postgres:postgres "$PGDATA" /run/postgresql
su postgres -s /bin/sh -c "initdb -D '$PGDATA' -A trust -U postgres >/dev/null"
su postgres -s /bin/sh -c "pg_ctl -D '$PGDATA' -l /tmp/build-postgres.log -o '-c listen_addresses=127.0.0.1 -c fsync=off -c full_page_writes=off' -w start"

cleanup() {
  su postgres -s /bin/sh -c "pg_ctl -D '$PGDATA' -m fast -w stop" >/dev/null 2>&1 || true
  rm -rf "$PGDATA"
}
trap cleanup EXIT

export DATABASE_URL=postgres://postgres@127.0.0.1:5432/postgres
export PAYLOAD_SECRET="build-only-$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"
export RAILWAY_BUILD_DB=1
case "${NEXT_PUBLIC_SERVER_URL:-}" in
http://* | https://*) ;;
*)
	echo "[railway-build] NEXT_PUBLIC_SERVER_URL='${NEXT_PUBLIC_SERVER_URL:-}' is not an http(s) URL; using http://localhost:3000" >&2
	export NEXT_PUBLIC_SERVER_URL=http://localhost:3000 ;;
esac
echo "[railway-build] building for $NEXT_PUBLIC_SERVER_URL"

# Apply the bundled migrations once, so parallel prerender workers find a ready schema.
NODE_ENV=production npx payload migrate
npm run build
