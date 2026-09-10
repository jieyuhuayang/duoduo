#!/usr/bin/env bash
# End-to-end reproducible pipeline: shipped minified bundle -> runnable, renamed,
# provably-equivalent reconstruction + a symbol index docs can cite by identity.
#
# The pipeline exists to make every claim in ../../docs re-checkable, and it only
# has to recover three things from the bundle:
#
#   IDENTITY  which code is duoduo's own  -> export_blocks.mjs + maps/modules_*.json
#             esbuild emits one __export block per source module, so the block IS
#             the module. This is structural, not a guess from the name.
#   NAMING    what each symbol is called  -> the __export block bodies, verbatim
#   BINDING   how a doc points at code    -> symbol_index.mjs + verify_citations.mjs
#             by real name + structural signature, so line numbers are derived
#             rather than hand-maintained
#
# Everything else here proves one of those three was done right.
#
# Only bundles with a first-party export table are worth running: daemon (107
# block names + 5 entry exports) and cli (20 + 14). stdio, pi-worker, channel-acp
# and feishu-gateway recover 9, 0, 0 and 1 name respectively -- pi-worker and
# channel-acp because they are entry bundles whose own modules are inlined, so
# their 621 recovered names are 100% inlined zod. Renaming nothing and then
# proving the nothing is AST-equivalent is not evidence. Naming those bundles
# needs the hand-derived route (locate_by_anchor.mjs -> maps/inferred_*.json).
#
# Usage:
#   PKG=/path/to/@openduo/duoduo/dist/release bash rebuild.sh
#   BEAUTIFIED=/path/with/*.pretty.js       bash rebuild.sh   # skip beautify
#   JOBS=1 ...                                                # serial, for bisecting
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$HERE/../.build}"
MAPS="$HERE/../maps"
JOBS="${JOBS:-2}"
NAMES=(daemon cli)
mkdir -p "$OUT"

# ---- 0. beautify -----------------------------------------------------------
# Line numbers are an output of the formatter, and every doc anchor is built on
# them, so the formatter is a pinned dependency (tools/package.json), not an
# `npx` call that silently follows the latest release. js-beautify 2.0.3
# reproduces the line numbering the committed artifacts and docs already use.
if [ -n "${BEAUTIFIED:-}" ]; then
  echo "==== beautify: skipped (BEAUTIFIED=$BEAUTIFIED) ===="
else
  PKG="${PKG:?set PKG=dir with the shipped dist/release/*.js, or BEAUTIFIED=dir with *.pretty.js}"
  BEAUTIFIED="$OUT/beautified"
  mkdir -p "$BEAUTIFIED"
  BEAUTIFY="$HERE/node_modules/.bin/js-beautify"
  [ -x "$BEAUTIFY" ] || { echo "js-beautify missing -- run: (cd $HERE && npm install)"; exit 1; }
  echo "==== beautify (js-beautify $(node -p "require('$HERE/node_modules/js-beautify/package.json').version")) ===="
  for name in "${NAMES[@]}"; do
    node --max-old-space-size=8192 "$BEAUTIFY" "$PKG/$name.js" > "$BEAUTIFIED/$name.pretty.js"
    echo "  $name.pretty.js: $(wc -l < "$BEAUTIFIED/$name.pretty.js" | tr -d ' ') lines"
  done
fi

run_bundle() {
  local name="$1"
  local PRETTY="$BEAUTIFIED/$name.pretty.js"

  # 1. lossless de-bundle. Nothing downstream consumes the split modules --
  #    rename.mjs reads the beautified bundle directly -- so this is a
  #    self-contained proof that the de-bundler is faithful, kept because
  #    CLAUDE.md names byte-identical reassembly as a checkable invariant.
  #    The split dir MUST start empty: split.mjs writes one file per segment and
  #    never deletes, so a leftover tree from an earlier version contributes
  #    stale files that the fresh manifest happens to name, and the byte-identity
  #    proof silently compares against a mixture of two builds.
  rm -rf "$OUT/$name"
  node "$HERE/split.mjs"      "$PRETTY" "$OUT/$name"
  node "$HERE/reassemble.mjs" "$OUT/$name" "$OUT/$name.reassembled.js"
  cmp -s "$PRETTY" "$OUT/$name.reassembled.js" \
    && echo "  lossless: OK (byte-identical)" || { echo "  lossless: FAIL"; return 1; }

  # 2. identity + naming: group export names by source module, then decide
  #    first-party per MODULE. The gate fires on an unrecognised block, i.e.
  #    once per new upstream module rather than once per unknown name.
  node --max-old-space-size=8192 "$HERE/export_blocks.mjs" "$PRETTY" --json "$OUT/blocks_$name.json"
  node "$HERE/build_rename.mjs" "$OUT/blocks_$name.json" "$MAPS/modules_$name.json" \
       "$MAPS/inferred_$name.json" "$OUT/rename_$name.json"

  # 2b. every RE-inferred name must still resolve to function-like code of the
  #     recorded shape. Renaming is scope-safe, so a name pinned to the wrong
  #     declaration passes every check below this line; this is the only step
  #     that can see it.
  if [ -f "$MAPS/inferred_$name.json" ]; then
    node "$HERE/verify_inferred.mjs" check "$PRETTY" \
         "$MAPS/inferred_$name.json" "$MAPS/inferred_$name.shape.json"
  fi

  # 3. scope-safe, formatting-preserving rename (line numbers are preserved,
  #    which is what lets first-party/ headers cite the pretty bundle).
  node "$HERE/rename.mjs" "$PRETTY" "$OUT/rename_$name.json" \
       "$OUT/$name.recon.js" "$OUT/rename_$name.report.json"

  # 4. prove semantic equivalence + syntax
  node --check "$OUT/$name.recon.js" && echo "  syntax: OK"
  node "$HERE/ast_equiv.mjs" "$PRETTY" "$OUT/$name.recon.js" "$OUT/rename_$name.json"

  # 5. binding: where each symbol is, and a version-stable hash of its body.
  node --max-old-space-size=8192 "$HERE/symbol_index.mjs" "$PRETTY" \
       "$OUT/rename_$name.json" "$OUT/symbols_$name.json" --version "${PKG_VERSION:-unrecorded}"
}

rc=0
if [ "$JOBS" = "1" ]; then
  for name in "${NAMES[@]}"; do
    echo "==== $name ===="
    run_bundle "$name" || rc=1
  done
else
  # Indexed arrays, not associative: macOS ships bash 3.2, where `declare -A`
  # is a syntax error and the whole script dies before running anything.
  pids=()
  for name in "${NAMES[@]}"; do
    run_bundle "$name" > "$OUT/$name.log" 2>&1 &
    pids+=("$!")
  done
  for i in "${!NAMES[@]}"; do
    wait "${pids[$i]}" || rc=1
    echo "==== ${NAMES[$i]} ===="
    cat "$OUT/${NAMES[$i]}.log"
  done
fi
[ "$rc" -eq 0 ] || { echo "FAILED (see logs in $OUT)"; exit 1; }

# 6. the readable tree is what humans read, and every way it can be wrong is
#    silent -- verify it against the bundle whenever it is present.
FP="$HERE/../first-party"
if [ -d "$FP" ] && [ -f "$HERE/../recon/daemon.recon.js" ]; then
  echo "==== first-party tree ===="
  node "$HERE/verify_first_party.mjs" "$FP" "$HERE/../recon/daemon.recon.js" \
       "$MAPS/rename_daemon.json" "$BEAUTIFIED/daemon.pretty.js" || rc=1
fi

DOCS="$HERE/../../docs"
if [ -d "$DOCS" ]; then
  # 7. citations, checked by symbol identity. A vanished symbol or a wrong short
  #    name fails the build; a drifted line number does not, because it is
  #    regenerable -- re-run with --fix.
  echo "==== citations (by symbol identity) ===="
  IDX="$OUT/symbols_daemon.json"; [ -f "$OUT/symbols_cli.json" ] && IDX="$IDX,$OUT/symbols_cli.json"
  node "$HERE/verify_citations.mjs" "$IDX" \
       --bundle "daemon=$BEAUTIFIED/daemon.pretty.js" --bundle "cli=$BEAUTIFIED/cli.pretty.js" \
       "$DOCS"/*.md || rc=1

  # 8. the two legacy line-anchor checks. They cover the ~1600 hand-written line
  #    anchors that predate the symbol index and that step 7 does not parse.
  #    Both are ADVISORY: their exit codes are swallowed below, so neither can
  #    fail a build -- do not read a green run here as "all anchors verified".
  echo "==== line anchors (advisory) ===="
  node "$HERE/check_doc_anchors.mjs" --resolve "$BEAUTIFIED/daemon.pretty.js" "$DOCS"/*.md \
    || echo "  (advisory; known false positives are prose words in backticks)"
  node "$HERE/check_bare_anchors.mjs" "$BEAUTIFIED/daemon.pretty.js" \
       "$OUT/blocks_daemon.json" "$MAPS/modules_daemon.json" "$DOCS"/*.md \
    || echo "  (advisory; the refuted ones above cannot be correct citations)"
fi

# 9. one machine-readable record of what this run measured. Docs cite THIS
#    instead of restating counts in prose -- the counts in CLAUDE.md,
#    reconstruction/README.md and VERIFICATION.md had drifted into three
#    mutually contradictory values (712 / 733 / 739) precisely because every
#    one of them was hand-copied.
echo "==== pipeline report ===="
node "$HERE/pipeline_report.mjs" "$OUT" "$MAPS/pipeline_report.json" "${NAMES[@]}"

[ "$rc" -eq 0 ] || exit 1
echo "DONE -> $OUT"
