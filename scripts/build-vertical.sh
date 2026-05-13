#!/usr/bin/env bash
#
# Build a vertical of the converter.
#
# Usage:
#   ./scripts/build-vertical.sh accounting-bridge
#   ./scripts/build-vertical.sh --all
#
set -euo pipefail

VERTICALS=(base accounting-bridge edu-grades dev-data-kit crm-sync invoice-flow)

build_one() {
  local v=$1
  if [ ! -d "brands/$v" ]; then
    echo "✗ Unknown vertical: $v"
    exit 1
  fi

  echo "▶ Building vertical: $v"
  export NEXT_PUBLIC_BRAND=$v
  export BRAND=$v

  npm run build

  if [ "${SKIP_DOCKER:-0}" != "1" ] && command -v docker >/dev/null 2>&1; then
    docker build \
      --build-arg BRAND="$v" \
      -t "mwmsoftware/csv-converter-$v:latest" \
      -f docker/Dockerfile .
    echo "✓ Docker image built: mwmsoftware/csv-converter-$v:latest"
  else
    echo "ℹ Skipping Docker build (SKIP_DOCKER=1 or docker missing)"
  fi
}

if [ "${1:-}" = "--all" ]; then
  for v in "${VERTICALS[@]}"; do
    build_one "$v"
  done
else
  build_one "${1:-base}"
fi
