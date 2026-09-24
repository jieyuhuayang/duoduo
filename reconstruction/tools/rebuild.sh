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
#             rather than hand-maintained; every other line number must be
#             bound to a short name or a quoted snippet (anchor_forms.mjs)
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
#   PROMOTE=1 ...                             # write the results into recon/, maps/, first-party/
#
# Without PROMOTE the run writes only under $OUT and compares its results with
# the committed copies: a difference FAILS the build when the committed report
# claims the same package version (the committed files are stale or were
# edited by hand), and is reported as a pending retarget otherwise.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$HERE/../.build}"
MAPS="$HERE/../maps"
JOBS="${JOBS:-2}"
NAMES=(daemon cli)
mkdir -p "$OUT"
rm -f "$OUT/verdicts.txt"
# one `gate=value` line per conclusion, collected into pipeline_report.json
verdict() { echo "$1=$2" >> "$OUT/verdicts.txt"; }

# The version stamp goes into every generated artifact, so take it from the
# package when there is one, and refuse a hand-typed value that contradicts it.
if [ -n "${PKG:-}" ] && [ -f "$PKG/../../package.json" ]; then
  SHIPPED="v$(node -p 'require(require("path").resolve(process.argv[1])).version' "$PKG/../../package.json")"
  if [ -z "${PKG_VERSION:-}" ]; then PKG_VERSION="$SHIPPED"
  elif [ "$PKG_VERSION" != "$SHIPPED" ]; then
    echo "PKG_VERSION=$PKG_VERSION, but $PKG is $SHIPPED"; exit 1
  fi
fi
export PKG_VERSION="${PKG_VERSION:-unrecorded}"
echo "==== package $PKG_VERSION, node $(node --version) ===="

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
  verdict "$name.lossless" pass

  # 1b. the beautifier must not have changed the program. Every later proof
  #     starts from *.pretty.js, so without this the chain never reaches the
  #     file that actually ships. Needs the shipped bundle, i.e. PKG.
  if [ -n "${PKG:-}" ]; then
    echo "  beautify fidelity (shipped $name.js vs $name.pretty.js):"
    node --max-old-space-size=8192 "$HERE/ast_equiv.mjs" "$PKG/$name.js" "$PRETTY" | sed 's/^/    /'
    verdict "$name.beautifyEquivalent" pass
  else
    echo "  beautify fidelity: skipped (no PKG, so no shipped bundle to compare with)"
    verdict "$name.beautifyEquivalent" skipped
  fi

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
    verdict "$name.inferredNames" pass
  fi

  # 3. scope-safe, formatting-preserving rename (line numbers are preserved,
  #    which is what lets first-party/ headers cite the pretty bundle).
  node "$HERE/rename.mjs" "$PRETTY" "$OUT/rename_$name.json" \
       "$OUT/$name.recon.js" "$OUT/rename_$name.report.json"

  # 4. prove semantic equivalence + syntax. `node --check file.js` is vacuous
  #    here: with no "type":"module" above the file, Node (v25 at least) accepts
  #    an ESM .js containing a syntax error. Feeding it as a module on stdin
  #    makes Node really parse it.
  node --input-type=module --check < "$OUT/$name.recon.js"
  echo "  syntax: OK"; verdict "$name.syntax" pass
  node --max-old-space-size=8192 "$HERE/ast_equiv.mjs" "$PRETTY" "$OUT/$name.recon.js" "$OUT/rename_$name.json"
  verdict "$name.astEquivalent" pass

  # 5. binding: where each symbol is, and a version-stable hash of its body.
  node --max-old-space-size=8192 "$HERE/symbol_index.mjs" "$PRETTY" \
       "$OUT/rename_$name.json" "$OUT/symbols_$name.json" --version "$PKG_VERSION"

  # 6. the other generated artifacts, so they can be compared with (or promoted
  #    into) the committed copies instead of being maintained by hand
  node "$HERE/exports_map.mjs" "$PRETTY" > "$OUT/$name.exports.json" 2>/dev/null
  local inf="$MAPS/inferred_$name.json" sub="$MAPS/subsys_$name.json" table="RENAME_TABLE_$name.md"
  [ -f "$inf" ] || inf=-
  [ -f "$sub" ] || sub=-
  [ "$name" = daemon ] && table=RENAME_TABLE.md
  node "$HERE/gen_rename_table.mjs" "$PRETTY" "$OUT/rename_$name.json" "$inf" "$sub" "$OUT/$table"
  if [ "$name" = daemon ]; then
    rm -rf "$OUT/first-party"
    node "$HERE/extract_functions.mjs" "$OUT/daemon.recon.js" "$OUT/rename_daemon.json" \
         "$MAPS/subsys_daemon.json" "$OUT/first-party" "$PRETTY" "$MAPS/inferred_daemon.json" \
      | sed 's/^/  /'
  fi
}

# Each bundle runs as a background job, in both modes. That is what keeps
# `set -e` alive inside run_bundle: bash disables errexit for a function called
# on the left of `||` or `&&`, so the old serial form `run_bundle x || rc=1`
# returned the status of its LAST command and a NOT EQUIVALENT proof ended the
# build green. A job started with `&` is not in such a context.
rc=0
if [ "$JOBS" = "1" ]; then
  for name in "${NAMES[@]}"; do
    echo "==== $name ===="
    run_bundle "$name" &
    wait "$!" || { rc=1; echo "  $name: FAILED"; }
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

ROOT="$HERE/.."
report() {
  node "$HERE/pipeline_report.mjs" "$OUT" "$OUT/pipeline_report.json" "$BEAUTIFIED" "$OUT/first-party" "${NAMES[@]}"
}

# 7. fresh vs committed. Everything above proved things about $OUT; this is the
#    step that makes those proofs about the files in the repository.
echo "==== committed artifacts ===="
report > /dev/null 2>&1
if [ "${PROMOTE:-0}" = "1" ]; then
  node "$HERE/promote.mjs" write "$OUT" "$ROOT" "${NAMES[@]}"
  verdict committedInSync promoted
elif node "$HERE/promote.mjs" check "$OUT" "$ROOT" "${NAMES[@]}"; then
  verdict committedInSync pass
else
  COMMITTED_VERSION="$(node -p 'try { require(require("path").resolve(process.argv[1])).package } catch { "" }' "$MAPS/pipeline_report.json")"
  if [ "$COMMITTED_VERSION" = "$PKG_VERSION" ]; then
    echo "  FAIL: the committed artifacts claim $PKG_VERSION but differ from what $PKG_VERSION produces"
    echo "        (stale, or edited by hand). Inspect, then re-run with PROMOTE=1."
    verdict committedInSync fail; rc=1
  else
    echo "  pending retarget: committed artifacts are $COMMITTED_VERSION, this run is $PKG_VERSION."
    echo "  Re-run with PROMOTE=1 once the inferred map has been reviewed (see bump.sh)."
    verdict committedInSync "retarget-pending"
  fi
fi

# 8. the readable tree is what humans read, and every way it can be wrong is
#    silent -- verify the COMMITTED tree against the bundle.
FP="$ROOT/first-party"
if [ -d "$FP" ] && [ -f "$ROOT/recon/daemon.recon.js" ]; then
  echo "==== first-party tree ===="
  if node "$HERE/verify_first_party.mjs" "$FP" "$ROOT/recon/daemon.recon.js" \
       "$MAPS/rename_daemon.json" "$BEAUTIFIED/daemon.pretty.js" "$MAPS/inferred_daemon.json"; then
    verdict firstPartyTree pass
  else verdict firstPartyTree fail; rc=1; fi
fi

DOCS="$HERE/../../docs"
if [ -d "$DOCS" ]; then
  # 9. citations, checked by symbol identity. A vanished symbol or a wrong short
  #    name fails the build; a drifted line number does not, because it is
  #    regenerable -- re-run with --fix.
  echo "==== citations (by symbol identity) ===="
  IDX="$OUT/symbols_daemon.json"; [ -f "$OUT/symbols_cli.json" ] && IDX="$IDX,$OUT/symbols_cli.json"
  if node "$HERE/verify_citations.mjs" "$IDX" \
       --bundle "daemon=$BEAUTIFIED/daemon.pretty.js" --bundle "cli=$BEAUTIFIED/cli.pretty.js" \
       "$DOCS"/*.md "$ROOT"/*.md "$ROOT/../CLAUDE.md"; then
    verdict citations pass
  else verdict citations fail; rc=1; fi

  # 10. everything step 9 does not own (anchor_forms.mjs): name-bound snippets
  #    `code`（`realName`） (no line; checked inside the symbol's span), and the
  #    legacy line numbers — F2 short-name and F3 snippet citations, unbound
  #    numbers — whose per-doc counts may only decrease against
  #    maps/bare_anchor_baseline.json. All fatal. On a version bump the legacy
  #    lines move with the bundle: retarget them (remap_doc_anchors ->
  #    retarget_docs -> retarget_symbols) before this runs.
  echo "==== line anchors (short names, snippets, unbound) ===="
  if node "$HERE/check_doc_anchors.mjs" --resolve --index "$OUT/symbols_daemon.json" \
       "$BEAUTIFIED/daemon.pretty.js" "$DOCS"/*.md \
     && node "$HERE/check_bare_anchors.mjs" --index "$IDX" --bundle "cli=$BEAUTIFIED/cli.pretty.js" \
       --baseline "$MAPS/bare_anchor_baseline.json" \
       "$BEAUTIFIED/daemon.pretty.js" "$OUT/blocks_daemon.json" "$MAPS/modules_daemon.json" "$DOCS"/*.md; then
    verdict lineAnchors pass
  else verdict lineAnchors fail; rc=1; fi

  # 11. the anchor checkers themselves: each must pass a clean synthetic doc,
  #     fail each injected error, and refuse a bundle shifted by one line.
  echo "==== anchor checkers (mutation test) ===="
  if [ ! -f "$OUT/symbols_cli.json" ]; then
    echo "  skipped: needs the cli bundle's symbol index"
  elif node "$HERE/mutate_anchor_checks.mjs" "$BEAUTIFIED/daemon.pretty.js" "$BEAUTIFIED/cli.pretty.js" "$OUT"; then
    verdict anchorCheckers pass
  else verdict anchorCheckers fail; rc=1; fi
fi

# 12. one machine-readable record of what this run measured AND concluded. Docs
#     cite THIS instead of restating counts in prose -- the counts in CLAUDE.md,
#     reconstruction/README.md and VERIFICATION.md had drifted into three
#     mutually contradictory values (712 / 733 / 739) precisely because every
#     one of them was hand-copied. It lands in maps/ only with PROMOTE=1.
echo "==== pipeline report ===="
report
[ "${PROMOTE:-0}" = "1" ] && cp "$OUT/pipeline_report.json" "$MAPS/pipeline_report.json"

[ "$rc" -eq 0 ] || { echo "FAILED"; exit 1; }
echo "DONE -> $OUT"
