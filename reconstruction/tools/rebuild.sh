#!/usr/bin/env bash
# End-to-end reproducible pipeline: minified bundle -> runnable, renamed,
# provably-equivalent reconstruction + readable first-party source tree.
#
# Prereqs:
#   - Node >= 18 with npm; Babel installed (see tools/package note below)
#   - The installed package's shipped bundles at $PKG/dist/release/*.js
#   - Beautified (js-beautify) bundles at $BEAUTIFIED/{daemon,cli,stdio}.pretty.js
#
# Beautify step (one-off, not repeated here):
#   npx esbuild --bundle is NOT needed; the shipped files are already bundled.
#   npx js-beautify daemon.js > daemon.pretty.js   (etc.)
#
# The three bundles share no state, so they run concurrently and each writes to
# its own log; the logs are replayed in a fixed order afterwards so the output
# reads the same as the old sequential run regardless of who finished first.
# Set JOBS=1 to force sequential execution when bisecting a failure.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
BEAUTIFIED="${BEAUTIFIED:?set BEAUTIFIED=dir with *.pretty.js}"
OUT="${OUT:-$HERE/../.build}"
JOBS="${JOBS:-3}"
mkdir -p "$OUT"
echo '{}' > "$OUT/empty.json"     # written once, before any bundle reads it

run_bundle() {
  local name="$1"
  # 1. lossless de-bundle (byte-identical reassembly is the correctness proof)
  node "$HERE/split.mjs"      "$BEAUTIFIED/$name.pretty.js" "$OUT/$name"
  node "$HERE/reassemble.mjs" "$OUT/$name" "$OUT/$name.reassembled.js"
  cmp -s "$BEAUTIFIED/$name.pretty.js" "$OUT/$name.reassembled.js" \
    && echo "  lossless: OK (byte-identical)" || { echo "  lossless: FAIL"; return 1; }

  # 2. recover original export names + build first-party rename map
  node "$HERE/exports_map.mjs" "$BEAUTIFIED/$name.pretty.js" > "$OUT/$name.exports.json"
  local INF="$HERE/../maps/inferred_$name.json"; [ -f "$INF" ] || INF="$OUT/empty.json"
  # 4th arg arms the coverage gate: any export name that is neither classified
  # first-party nor recorded as vendor stops the build (see build_rename.mjs).
  node "$HERE/build_rename.mjs" "$OUT/$name.exports.json" "$INF" "$OUT/rename_$name.json" \
       "$HERE/../maps/vendor_baseline_$name.json"

  # 3. scope-safe, formatting-preserving rename
  node "$HERE/rename.mjs" "$BEAUTIFIED/$name.pretty.js" "$OUT/rename_$name.json" \
       "$OUT/$name.recon.js" "$OUT/rename_$name.report.json"

  # 4. prove semantic equivalence + syntax
  node --check "$OUT/$name.recon.js" && echo "  syntax: OK"
  node "$HERE/ast_equiv.mjs" "$BEAUTIFIED/$name.pretty.js" "$OUT/$name.recon.js" "$OUT/rename_$name.json"
}

NAMES=(daemon cli stdio)
rc=0
if [ "$JOBS" = "1" ]; then
  for name in "${NAMES[@]}"; do
    echo "==== $name ===="
    run_bundle "$name" || rc=1
  done
else
  declare -A pid_of
  for name in "${NAMES[@]}"; do
    run_bundle "$name" > "$OUT/$name.log" 2>&1 &
    pid_of[$name]=$!
  done
  for name in "${NAMES[@]}"; do
    wait "${pid_of[$name]}" || rc=1
    echo "==== $name ===="
    cat "$OUT/$name.log"
  done
fi
[ "$rc" -eq 0 ] || { echo "FAILED (see logs in $OUT)"; exit 1; }

# 5. the readable tree is what humans read, and every way it can be wrong is
#    silent -- verify it against the bundle whenever it is present.
FP="$HERE/../first-party"
if [ -d "$FP" ] && [ -f "$HERE/../recon/daemon.recon.js" ]; then
  echo "==== first-party tree ===="
  node "$HERE/verify_first_party.mjs" "$FP" "$HERE/../recon/daemon.recon.js" \
       "$HERE/../maps/rename_daemon.json" "$BEAUTIFIED/daemon.pretty.js" || rc=1
fi

# 6. docs cite `symbol`(`line`) into the daemon bundle; a version bump moves
#    both halves. Non-fatal: prose words in backticks trip the regex.
DOCS="$HERE/../../docs"
if [ -d "$DOCS" ]; then
  echo "==== doc anchors ===="
  node "$HERE/check_doc_anchors.mjs" --resolve "$BEAUTIFIED/daemon.pretty.js" "$DOCS"/*.md \
    || echo "  (review the above; known false positives are prose words in backticks)"
fi

[ "$rc" -eq 0 ] || exit 1
echo "DONE -> $OUT"
