#!/usr/bin/env bash
# Deploy the VS Auto site + functions to Netlify.
# Stages only the public files so docs/, scripts/ and function source
# never end up served as static pages.
set -euo pipefail
cd "$(dirname "$0")/.."

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp index.html netlify.toml "$STAGE/"
cp -R assets "$STAGE/assets"

npx --yes netlify-cli@latest deploy --prod \
  --site a5f18216-4921-4215-aaef-8915a8eef1a5 \
  --dir "$STAGE" \
  --functions netlify/functions
