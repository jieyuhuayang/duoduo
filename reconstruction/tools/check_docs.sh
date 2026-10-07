#!/usr/bin/env bash
# The doc checks of rebuild.sh (steps 9 and 10: citations and line anchors),
# alone, against the index and pretty bundles a previous rebuild.sh run left in
# $OUT. For editing docs: a full run with PKG beautifies, splits, renames and
# proves both bundles again (about two minutes) although a doc edit changes none
# of that; this takes seconds. At the v0.8.4 bump the docs went through several
# rounds of fixes, each run by hand as the three checkers' command lines.
#
# It proves nothing about the reconstruction and writes nothing: no verdict, no
# report, no promote. rebuild.sh, which CI runs, stays the gate. The checkers
# each refuse a bundle their index was not built from (bundle_guard.mjs), so a
# stale $OUT fails loudly rather than checking the wrong release.
#
# Mid-bump (docs already retargeted, maps/ not yet promoted) point OUT at the
# step-2 check-mode run's directory, which indexes the new release, as for
# name_symbol.mjs --build.
#
# Usage: [OUT=<rebuild.sh OUT>] bash check_docs.sh [doc.md...]
#   with no docs: every file rebuild.sh checks (docs/*.md for all three
#   checkers, plus CLAUDE.md and reconstruction/*.md for the citations)
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$HERE/../.build}"
ROOT="$HERE/.."
MAPS="$ROOT/maps"
DOCS="$ROOT/../docs"

for f in "$OUT/symbols_daemon.json" "$OUT/symbols_cli.json" "$OUT/blocks_daemon.json"; do
  [ -f "$f" ] || { echo "no $f: run rebuild.sh once (OUT=$OUT) to produce the index this checks against"; exit 2; }
done
IDX="$OUT/symbols_daemon.json,$OUT/symbols_cli.json"
# the index records the pretty bundle it was built from
BEAUTIFIED="$(node -p 'require("path").dirname(require(process.argv[1]).source)' "$OUT/symbols_daemon.json")"
VERSION="$(node -p 'require(process.argv[1]).version' "$OUT/symbols_daemon.json")"
for b in daemon cli; do
  [ -f "$BEAUTIFIED/$b.pretty.js" ] || { echo "no $BEAUTIFIED/$b.pretty.js (the index's source): run rebuild.sh again"; exit 2; }
done
echo "checking against $VERSION ($OUT)"

if [ "$#" -gt 0 ]; then
  CITE=("$@"); ANCHOR=()
  for d in "$@"; do case "$(cd "$(dirname "$d")" && pwd)" in "$(cd "$DOCS" && pwd)") ANCHOR+=("$d");; esac; done
else
  CITE=("$DOCS"/*.md "$ROOT"/*.md "$ROOT/../CLAUDE.md"); ANCHOR=("$DOCS"/*.md)
fi

rc=0
echo "==== citations (by symbol identity) ===="
node "$HERE/verify_citations.mjs" "$IDX" \
  --bundle "daemon=$BEAUTIFIED/daemon.pretty.js" --bundle "cli=$BEAUTIFIED/cli.pretty.js" "${CITE[@]}" || rc=1

echo "==== line anchors (short names, snippets, unbound) ===="
if [ "${#ANCHOR[@]}" -eq 0 ]; then
  echo "  (no file under docs/ given: rebuild.sh runs these only over docs/*.md)"
else
  # the ceilings are per doc, so a subset of docs is checked against its own rows
  node "$HERE/check_doc_anchors.mjs" --resolve --index "$IDX" --bundle "cli=$BEAUTIFIED/cli.pretty.js" \
    "$BEAUTIFIED/daemon.pretty.js" "${ANCHOR[@]}" || rc=1
  node "$HERE/check_bare_anchors.mjs" --index "$IDX" --bundle "cli=$BEAUTIFIED/cli.pretty.js" \
    --baseline "$MAPS/bare_anchor_baseline.json" \
    "$BEAUTIFIED/daemon.pretty.js" "$OUT/blocks_daemon.json" "$MAPS/modules_daemon.json" "${ANCHOR[@]}" || rc=1
fi

[ "$rc" -eq 0 ] && echo "docs: pass (citations, line anchors; rebuild.sh is still the gate)" || echo "docs: FAIL"
exit "$rc"
