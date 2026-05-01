#!/usr/bin/env bash
#
# Sync whitepaper HTMLs from ds-beeps (source of truth) into this share repo.
#
# Usage: ./scripts/sync-whitepapers.sh
#
# - Copies every *.html in ../ds-beeps/whitepapers/ into the share repo root,
#   preserving the same filename so links stay stable.
# - Copies the asset folders (assets/, logos/, logos/images/) referenced by
#   those HTMLs, merging into the share repo's existing folders without
#   overwriting unrelated files.
# - Reports what changed; does NOT commit or push.
#
# Run this when a new whitepaper HTML lands in ds-beeps and you want to publish
# it. Then commit and push from share/ to trigger the Vercel deploy.
#
# Parallel to scripts/sync-rahs.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DS_BEEPS_WP="$SHARE_ROOT/../ds-beeps/whitepapers"

if [ ! -d "$DS_BEEPS_WP" ]; then
  echo "error: ds-beeps/whitepapers not found at $DS_BEEPS_WP" >&2
  echo "  expected workspace layout: ../ds-beeps next to this share repo" >&2
  exit 1
fi

shopt -s nullglob
htmls=( "$DS_BEEPS_WP"/*.html )
shopt -u nullglob

if [ ${#htmls[@]} -eq 0 ]; then
  echo "no HTML whitepapers found in $DS_BEEPS_WP; nothing to sync"
  exit 0
fi

echo "Syncing ${#htmls[@]} whitepaper HTML(s) from ds-beeps:"
for src in "${htmls[@]}"; do
  base="$(basename "$src")"
  dst="$SHARE_ROOT/$base"
  cp "$src" "$dst"
  echo "  copied $base"
done

# Sync asset folders that the HTMLs reference. Merge non-destructively.
for sub in assets logos; do
  if [ -d "$DS_BEEPS_WP/$sub" ]; then
    mkdir -p "$SHARE_ROOT/$sub"
    cp -R "$DS_BEEPS_WP/$sub"/. "$SHARE_ROOT/$sub/"
    echo "  merged $sub/"
  fi
done

echo ""
echo "Done. Review with: git -C $SHARE_ROOT status"
echo "Commit + push to deploy via Vercel."
