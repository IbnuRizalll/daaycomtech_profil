#!/usr/bin/env bash
set -euo pipefail

if [ ! -f ".env.ubuntu" ]; then
  echo "File .env.ubuntu tidak ditemukan."
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "Gunakan: bash scripts/ubuntu-run.sh <command>"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ".env.ubuntu"
set +a

exec "$@"
