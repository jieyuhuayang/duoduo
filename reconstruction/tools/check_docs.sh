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
# node require()s the index files below by this path, which resolves a relative
# one against the script, not the caller's directory
OUT="$(cd "$OUT" 2>/dev/null && pwd)" || { echo "no directory ${OUT}: run rebuild.sh first"; exit 2; }
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

# the three enumerations of INTERNALS Appendix B against the sets the bundle
# holds (rebuild.sh step 10b, verdict appendixSets); only when that doc is in
# the set given
echo "==== appendix sets (event types, RPC methods, read-only allowlist) ===="
APPX="$(readlink -f "$DOCS/AGENT_INTERNALS_ANALYSIS.md")"
# compared by resolved path, so a relative or absolute spelling of the doc
# counts; the name of a check that did not run is not in the pass line
RAN="citations"
[ "${#ANCHOR[@]}" -gt 0 ] && RAN="$RAN, line anchors"
WANT_APPX=0
if [ "$#" -eq 0 ]; then WANT_APPX=1; else for d in "$@"; do [ "$(readlink -f "$d")" = "$APPX" ] && WANT_APPX=1; done; fi
if [ "$WANT_APPX" -eq 1 ]; then
  node "$HERE/check_appendix_sets.mjs" --index "$OUT/symbols_daemon.json" --xref "$OUT/xref_daemon.json" \
    --bundle "$BEAUTIFIED/daemon.pretty.js" "$APPX" || rc=1
  RAN="$RAN, appendix sets"
else
  echo "  (docs/AGENT_INTERNALS_ANALYSIS.md not given: skipped)"
fi

[ "$rc" -eq 0 ] && echo "docs: pass ($RAN; rebuild.sh is still the gate)" || echo "docs: FAIL"
exit "$rc"
