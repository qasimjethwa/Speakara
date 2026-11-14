#!/usr/bin/env bash
# Applies the migrations to a throwaway local Postgres and runs the RLS assertions. Needs Postgres 15+ binaries.
set -euo pipefail
BIN=${PG_BIN:-/usr/lib/postgresql/16/bin}; DIR=$(mktemp -d); HERE=$(cd "$(dirname "$0")" && pwd); PORT=${PGPORT_TEST:-54329}
trap '"$BIN/pg_ctl" -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
"$BIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"$BIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -w start >/dev/null
P="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$P -f "$HERE/local_stub.sql"
for f in "$HERE"/../migrations/*.sql; do $P -f "$f"; done
$P -t -f "$HERE/rls_test.sql"
