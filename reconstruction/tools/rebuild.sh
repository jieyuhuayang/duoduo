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
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
BEAUTIFIED="${BEAUTIFIED:?set BEAUTIFIED=dir with *.pretty.js}"
OUT="${OUT:-$HERE/../.build}"
mkdir -p "$OUT"

for name in daemon cli stdio; do
  echo "==== $name ===="
  # 1. lossless de-bundle (byte-identical reassembly is the correctness proof)
  node "$HERE/split.mjs"      "$BEAUTIFIED/$name.pretty.js" "$OUT/$name"
  node "$HERE/reassemble.mjs" "$OUT/$name" "$OUT/$name.reassembled.js"
  cmp -s "$BEAUTIFIED/$name.pretty.js" "$OUT/$name.reassembled.js" \
    && echo "  lossless: OK (byte-identical)" || { echo "  lossless: FAIL"; exit 1; }

  # 2. recover original export names + build first-party rename map
  node "$HERE/exports_map.mjs" "$BEAUTIFIED/$name.pretty.js" > "$OUT/$name.exports.json"
  INF="$HERE/../maps/inferred_$name.json"; [ -f "$INF" ] || INF="$OUT/empty.json"; echo '{}' > "$OUT/empty.json"
  node "$HERE/build_rename.mjs" "$OUT/$name.exports.json" "$INF" "$OUT/rename_$name.json"

  # 3. scope-safe, formatting-preserving rename
  node "$HERE/rename.mjs" "$BEAUTIFIED/$name.pretty.js" "$OUT/rename_$name.json" \
       "$OUT/$name.recon.js" "$OUT/rename_$name.report.json"

  # 4. prove semantic equivalence + syntax
  node --check "$OUT/$name.recon.js" && echo "  syntax: OK"
  node "$HERE/ast_equiv.mjs" "$BEAUTIFIED/$name.pretty.js" "$OUT/$name.recon.js" "$OUT/rename_$name.json"
done
echo "DONE -> $OUT"
