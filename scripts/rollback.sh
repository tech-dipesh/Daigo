#!/usr/bin/env bash
cd ~/daigo || exit 1
. ./.release 2>/dev/null
bad="$TAG"
[ -n "$PREV" ] && [ "$PREV" != "latest" ] || { echo "no previous release saved"; exit 1; }
export OWNER TAG="$PREV"
docker compose pull app ws
docker compose up -d --remove-orphans --wait --wait-timeout 120 || exit 1
printf 'OWNER=%s\nTAG=%s\nPREV=%s\n' "$OWNER" "$PREV" "$bad" > .release
echo "back on $PREV, database migrations are not undone"
