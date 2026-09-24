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
# Only bundles with a first-party export table are worth running: daemon and
# cli. How many names each one recovers (export blocks, entry exports, inferred
# names) is in maps/pipeline_report.json -- read it there. The copy of those
# counts that used to stand in this comment had already drifted from the report.
# stdio, pi-worker, channel-acp and feishu-gateway recover next to no
# first-party names: pi-worker and channel-acp are entry bundles whose own
# modules are inlined, so the names their export tables do carry are inlined
# zod. Renaming nothing and then proving the nothing is AST-equivalent is not
# evidence. Naming those bundles needs the hand-derived route
# (locate_by_anchor.mjs -> maps/inferred_*.json).
#
# Usage:
#   PKG=/path/to/@openduo/duoduo/dist/release bash rebuild.sh   # the full proof
#   BEAUTIFIED=/path/with/*.pretty.js         bash rebuild.sh   # skips beautify AND the
#                                                               # beautify-fidelity proof
#   JOBS=1 ...          # bundles one at a time, and the mutation test's checker
#                       # runs one at a time too -- for bisecting a failure
#   PROMOTE=1 PKG=...   # write the results into recon/, maps/, first-party/
#   MAPS=<dir> ...      # read the hand-made maps (inferred/subsys/modules/shape,
#                       # the anchor baseline) from a copy instead of ../maps, to
#                       # try a naming (name_symbol.mjs --maps <dir>) end to end
#                       # without touching the repository. Refused with PROMOTE,
#                       # and step 8 then checks the candidate tree in $OUT: the
#                       # committed tree is described by the committed maps.
#
# Without PROMOTE the run writes only under $OUT and compares its results with
# the committed copies: a difference FAILS the build when the committed report
# claims the same package version (the committed files are stale or were
# edited by hand), and is reported as a pending retarget otherwise.
#
# PROMOTE=1 is refused before anything is written -- $OUT included -- unless
#   - PKG is set inside an installed @openduo/duoduo, so the version stamp is
#     read from its package.json and the beautify-fidelity proof runs. The v0.8.3
#     promote was a BEAUTIFIED-only run: maps/pipeline_report.json recorded
#     beautifyEquivalent=skipped, and a promote without a hand-typed PKG_VERSION
#     would have stamped "unrecorded" -- the version CI then tries to install;
#   - docs/.pretty-anchor-target already names that version, i.e. the docs have
#     been retargeted to the release being promoted;
#   - BEAUTIFIED is not set, so step 0 beautifies PKG with the pinned
#     js-beautify. The beautify-fidelity proof shows that *.pretty.js has the
#     shipped AST, not that its LAYOUT came from the pinned formatter, and the
#     layout is what every line number promoted into maps/ and first-party/ is
#     made of. PKG+BEAUTIFIED used to pass this preflight and promote whatever
#     formatter had produced the given files; only the next CI run, beautifying
#     afresh, would have noticed.
# It then runs gates 8-11 against the CANDIDATE artifacts in $OUT and writes
# only if every one passed. It used to write at step 7 and run those gates
# afterwards, so a failing gate left the working tree holding the promoted
# artifacts. promote.mjs itself refuses a report whose proof verdicts are not
# all `pass` (a `warn` from the inferred-name check included).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$HERE/../.build}"
ROOT="$HERE/.."
REPO_MAPS="$(cd "$ROOT/maps" && pwd)"
MAPS="${MAPS:-$REPO_MAPS}"
MAPS="$(cd "$MAPS" && pwd)" || { echo "MAPS=$MAPS is not a directory"; exit 2; }
MAPS_OVERRIDE=0; [ "$MAPS" = "$REPO_MAPS" ] || MAPS_OVERRIDE=1
DOCS="$ROOT/../docs"
JOBS="${JOBS:-2}"
PROMOTE="${PROMOTE:-0}"
NAMES=(daemon cli)

# The toolchain is pinned to one Node major: the repo-root .nvmrc, which CI's
# setup-node reads too. Another major is only warned about, not refused -- but
# when this run and CI disagree, a difference in Node is the first suspect.
WANT_NODE=""
if [ -f "$ROOT/../.nvmrc" ]; then WANT_NODE="$(tr -d '[:space:]' < "$ROOT/../.nvmrc")"; fi
HAVE_NODE="$(node -p 'process.versions.node.split(".")[0]')"
if [ -n "$WANT_NODE" ] && [ "$HAVE_NODE" != "$WANT_NODE" ]; then
  echo "WARNING: running on node $(node --version), but .nvmrc and CI pin Node $WANT_NODE;"
  echo "         results are not guaranteed to match CI's"
fi

# The version stamp goes into every generated artifact, so take it from the
# package when there is one, and refuse a hand-typed value that contradicts it.
SHIPPED=""
if [ -n "${PKG:-}" ] && [ -f "$PKG/../../package.json" ]; then
  SHIPPED="v$(node -p 'require(require("path").resolve(process.argv[1])).version' "$PKG/../../package.json")"
  if [ -z "${PKG_VERSION:-}" ]; then PKG_VERSION="$SHIPPED"
  elif [ "$PKG_VERSION" != "$SHIPPED" ]; then
    echo "PKG_VERSION=$PKG_VERSION, but $PKG is $SHIPPED"; exit 1
  fi
fi
export PKG_VERSION="${PKG_VERSION:-unrecorded}"

# The two version records a run is checked against: what maps/ was generated
# from, and what the docs' line numbers were retargeted to (retarget_docs.mjs
# --stamp writes it; CLAUDE.md's upstream check reads it as "the version this
# repo last reconstructed to").
# (the committed record, also under a MAPS override: a copy need not carry one)
COMMITTED_VERSION="$(node -p 'try { require(require("path").resolve(process.argv[1])).package } catch { "" }' "$REPO_MAPS/pipeline_report.json")"
DOCS_TARGET=""
if [ -f "$DOCS/.pretty-anchor-target" ]; then DOCS_TARGET="$(tr -d '[:space:]' < "$DOCS/.pretty-anchor-target")"; fi

# PROMOTE preflight. Every refusal happens here, before $OUT or the repository
# is touched; the gates that need a full run are enforced after it (step 12).
if [ "$PROMOTE" = "1" ]; then
  refuse() { echo "PROMOTE=1 refused: $1"; echo "  nothing was written."; exit 1; }
  [ "$MAPS_OVERRIDE" = "0" ] || refuse "MAPS=$MAPS is not the repository's maps/. A promote writes recon/, maps/ and first-party/ generated from the maps it read, and the hand-made maps they come from would stay behind in the copy; copy the reviewed maps into $REPO_MAPS first."
  [ -n "${PKG:-}" ] || refuse "PKG is not set. Without the shipped bundle the beautify-fidelity proof is skipped and nothing ties *.pretty.js to a release; set PKG=<...>/@openduo/duoduo/dist/release and unset BEAUTIFIED."
  [ -z "${BEAUTIFIED:-}" ] || refuse "BEAUTIFIED is set. A promote writes line numbers into maps/ and first-party/, and those come from the formatter's layout, which the fidelity proof does not check; unset BEAUTIFIED so step 0 beautifies \$PKG with the pinned js-beautify."
  [ -n "$SHIPPED" ] || refuse "$PKG/../../package.json does not exist, so the version stamp would be hand-typed or \"unrecorded\". Point PKG at dist/release inside an installed @openduo/duoduo."
  case "$PKG_VERSION" in
    v[0-9]*.[0-9]*.[0-9]*) ;;
    *) refuse "\"$PKG_VERSION\" is not a release version." ;;
  esac
  for name in "${NAMES[@]}"; do [ -f "$PKG/$name.js" ] || refuse "$PKG/$name.js does not exist."; done
  [ "$DOCS_TARGET" = "$PKG_VERSION" ] || refuse "docs/.pretty-anchor-target says \"${DOCS_TARGET:-<missing>}\", this run is $PKG_VERSION. Promoting would leave maps/ and docs/ describing different releases: retarget the docs first (retarget_docs.mjs apply --stamp $PKG_VERSION writes the target), against this run's \$OUT artifacts."
fi

mkdir -p "$OUT"
rm -f "$OUT/verdicts.txt"
# one `gate=value` line per conclusion, collected into pipeline_report.json
verdict() { echo "$1=$2" >> "$OUT/verdicts.txt"; }
MODE_NOTE=""; [ "$PROMOTE" = "1" ] && MODE_NOTE=", PROMOTE"
[ "$MAPS_OVERRIDE" = "1" ] && MODE_NOTE="$MODE_NOTE, MAPS=$MAPS"
echo "==== package $PKG_VERSION, node $(node --version)$MODE_NOTE ===="

# ---- 0. beautify -----------------------------------------------------------
# Line numbers are an output of the formatter, and every doc anchor is built on
# them, so the formatter is a pinned dependency (tools/package.json), not an
# `npx` call that silently follows the latest release. js-beautify 2.0.3
# reproduces the line numbering the committed artifacts and docs already use.
#
# The output directory is named after the release. It used to be one flat
# $OUT/beautified/ holding whatever the last run wrote, and a v0.8.1 leftover
# there was once read as current by the checkers (bundle_guard.mjs exists
# because of it). A version's own directory is rewritten whole, and flat
# leftovers of the old layout are removed so nothing can point at them.
if [ -n "${BEAUTIFIED:-}" ]; then
  echo "==== beautify: skipped (BEAUTIFIED=$BEAUTIFIED) ===="
else
  PKG="${PKG:?set PKG=dir with the shipped dist/release/*.js, or BEAUTIFIED=dir with *.pretty.js}"
  [ "$PKG_VERSION" != "unrecorded" ] || {
    echo "cannot name the beautified directory: $PKG/../../package.json is missing -- set PKG_VERSION"; exit 1; }
  BEAUTIFIED="$OUT/beautified/$PKG_VERSION"
  rm -f "$OUT"/beautified/*.pretty.js
  rm -rf "$BEAUTIFIED"
  mkdir -p "$BEAUTIFIED"
  BEAUTIFY="$HERE/node_modules/.bin/js-beautify"
  [ -x "$BEAUTIFY" ] || { echo "js-beautify missing -- run: (cd $HERE && npm ci)"; exit 1; }
  echo "==== beautify (js-beautify $(node -p "require('$HERE/node_modules/js-beautify/package.json').version")) -> $BEAUTIFIED ===="
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
  #     Exit 3 is "nothing refuted, but a shape warning needs a human re-read";
  #     it is recorded as `warn` instead of passing as a clean `pass`, and
  #     promote.mjs will not write a run that carries it. Re-read the names,
  #     then `verify_inferred.mjs record` -- that is the review, on record.
  if [ -f "$MAPS/inferred_$name.json" ]; then
    local inferred_rc=0
    node "$HERE/verify_inferred.mjs" check "$PRETTY" \
         "$MAPS/inferred_$name.json" "$MAPS/inferred_$name.shape.json" || inferred_rc=$?
    case "$inferred_rc" in
      0) verdict "$name.inferredNames" pass ;;
      3) verdict "$name.inferredNames" warn ;;
      *) verdict "$name.inferredNames" fail; return 1 ;;
    esac
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
if [ "$rc" -ne 0 ]; then
  echo "FAILED (see logs in $OUT)${MODE_NOTE:+ -- nothing was promoted}"
  exit 1
fi

# The report records the sha256 of every shipped bundle ($PKG) and pretty
# bundle this run read, so a record is tied to bytes, not just a version string.
report() {
  node "$HERE/pipeline_report.mjs" ${PKG:+--shipped "$PKG"} \
       "$OUT" "$OUT/pipeline_report.json" "$BEAUTIFIED" "$OUT/first-party" "${NAMES[@]}"
}

# 7. fresh vs committed. Everything above proved things about $OUT; this is the
#    step that makes those proofs about the files in the repository. In PROMOTE
#    mode there is nothing to compare yet: the committed copies are about to be
#    replaced, and step 12 writes them only after every gate below has passed.
if [ "$PROMOTE" != "1" ]; then
  echo "==== committed artifacts ===="
  report > /dev/null 2>&1
  if [ "$MAPS_OVERRIDE" = "1" ]; then
    # The run was generated from other hand-made maps than the committed
    # artifacts were, so a difference says nothing about either; it is listed
    # (the names the copy adds show up here), not judged.
    node "$HERE/promote.mjs" check "$OUT" "$ROOT" "${NAMES[@]}" || true
    echo "  unverified: MAPS=$MAPS is not the repository's maps/, so this run cannot say whether"
    echo "  the committed artifacts are in sync. Run without MAPS for a verdict."
    verdict committedInSync unverified
  elif node "$HERE/promote.mjs" check "$OUT" "$ROOT" "${NAMES[@]}"; then
    verdict committedInSync pass
  elif [ "$PKG_VERSION" = "unrecorded" ]; then
    # Every generated artifact carries the version stamp, so an unrecorded run
    # always differs from a committed one. That difference says nothing either
    # way; calling it a pending retarget (as this step used to) implied it did.
    echo "  unverified: this run has no package version (no PKG), so a stale commit cannot be"
    echo "  told from a pending retarget. Re-run with PKG for a verdict."
    verdict committedInSync unverified
  elif [ "$COMMITTED_VERSION" = "$PKG_VERSION" ]; then
    echo "  FAIL: the committed artifacts claim $PKG_VERSION but differ from what $PKG_VERSION produces"
    echo "        (stale, or edited by hand). Inspect, then re-run with PROMOTE=1."
    verdict committedInSync fail; rc=1
  else
    echo "  pending retarget: committed artifacts are $COMMITTED_VERSION, this run is $PKG_VERSION."
    echo "  Re-run with PROMOTE=1 once the inferred map has been reviewed (see bump.sh)."
    verdict committedInSync "retarget-pending"
  fi
fi

if [ -d "$DOCS" ]; then
  # 7b. the docs and maps/ must describe the same release. maps/pipeline_report.json
  #     "package" is what CI installs and proves; docs/.pretty-anchor-target is
  #     what the docs' line numbers were retargeted to and what CLAUDE.md's
  #     upstream check reads. Nothing compared the two, so they could name
  #     different releases with every gate green. They may differ only while a
  #     retarget is in flight: docs moved to this run's release ahead of the
  #     promote. The PROMOTE preflight already demanded that the docs name it.
  echo "==== docs target vs committed record ===="
  if [ "$PROMOTE" = "1" ]; then
    echo "  docs/.pretty-anchor-target = $DOCS_TARGET = this run (checked before the run)"
    verdict anchorTargetMatches pass
  elif [ -z "$DOCS_TARGET" ]; then
    echo "  FAIL: docs/.pretty-anchor-target is missing or empty"
    verdict anchorTargetMatches fail; rc=1
  elif [ "$DOCS_TARGET" = "$COMMITTED_VERSION" ]; then
    echo "  docs/.pretty-anchor-target = maps/pipeline_report.json package = $COMMITTED_VERSION"
    verdict anchorTargetMatches pass
  elif [ "$PKG_VERSION" != "unrecorded" ] && [ "$PKG_VERSION" != "$COMMITTED_VERSION" ] \
       && [ "$DOCS_TARGET" = "$PKG_VERSION" ]; then
    echo "  retarget in flight: docs target $DOCS_TARGET (this run), maps/ still $COMMITTED_VERSION"
    verdict anchorTargetMatches retarget-pending
  else
    echo "  FAIL: docs/.pretty-anchor-target says $DOCS_TARGET, maps/pipeline_report.json says"
    echo "        ${COMMITTED_VERSION:-<no committed report>} (this run: $PKG_VERSION)"
    verdict anchorTargetMatches fail; rc=1
  fi
fi

# 8. the readable tree is what humans read, and every way it can be wrong is
#    silent. Check mode verifies the COMMITTED tree against the bundle; PROMOTE
#    mode verifies the CANDIDATE tree in $OUT, which is what step 12 would write,
#    and so does a MAPS override: the committed tree was generated from the
#    committed maps, and checking it against a copy that names more symbols
#    fails on every name the copy adds.
if [ "$PROMOTE" = "1" ] || [ "$MAPS_OVERRIDE" = "1" ]; then
  FP_WHAT=candidate FP="$OUT/first-party" FP_RECON="$OUT/daemon.recon.js" FP_RENAME="$OUT/rename_daemon.json"
else
  FP_WHAT=committed FP="$ROOT/first-party" FP_RECON="$ROOT/recon/daemon.recon.js" FP_RENAME="$MAPS/rename_daemon.json"
fi
if [ -d "$FP" ] && [ -f "$FP_RECON" ]; then
  echo "==== first-party tree ($FP_WHAT) ===="
  if node "$HERE/verify_first_party.mjs" "$FP" "$FP_RECON" "$FP_RENAME" \
       "$BEAUTIFIED/daemon.pretty.js" "$MAPS/inferred_daemon.json" \
       "$MAPS/subsys_daemon.json"; then
    verdict firstPartyTree pass
  else verdict firstPartyTree fail; rc=1; fi
else
  echo "==== first-party tree: skipped (no $FP_WHAT tree at $FP) ===="
  verdict firstPartyTree skipped
fi

if [ -d "$DOCS" ]; then
  # 9. citations, checked by symbol identity. A vanished symbol or a wrong short
  #    name fails the build; a drifted line number does not, because it is
  #    regenerable -- re-run with --fix. The index is always this run's ($OUT),
  #    in both modes.
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
  #    check_doc_anchors gets the cli bundle too: without it every F2 citation
  #    qualified `cli.pretty.js:N` was skipped, and the ones that carry no real
  #    name (so verify_citations never sees them) were checked by nothing.
  echo "==== line anchors (short names, snippets, unbound) ===="
  if node "$HERE/check_doc_anchors.mjs" --resolve --index "$IDX" --bundle "cli=$BEAUTIFIED/cli.pretty.js" \
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
    verdict anchorCheckers skipped
  elif node "$HERE/mutate_anchor_checks.mjs" "$BEAUTIFIED/daemon.pretty.js" "$BEAUTIFIED/cli.pretty.js" "$OUT" "$MAPS/modules_daemon.json"; then
    verdict anchorCheckers pass
  else verdict anchorCheckers fail; rc=1; fi
fi

# 12. one machine-readable record of what this run measured AND concluded. Docs
#     cite THIS instead of restating counts in prose -- the counts in CLAUDE.md,
#     reconstruction/README.md and VERIFICATION.md had drifted into three
#     mutually contradictory values (712 / 733 / 739) precisely because every
#     one of them was hand-copied. It lands in maps/ only with PROMOTE=1, and
#     only together with the artifacts it describes.
echo "==== pipeline report ===="
if [ "$PROMOTE" = "1" ]; then
  if [ "$rc" -ne 0 ]; then
    verdict committedInSync promote-refused
    report
    echo "FAILED: a gate failed against the candidate artifacts in $OUT -- nothing was promoted"
    exit 1
  fi
  report
  echo "==== promote ===="
  if ! node "$HERE/promote.mjs" write "$OUT" "$ROOT" "${NAMES[@]}"; then
    verdict committedInSync promote-refused
    report > /dev/null 2>&1 || true
    echo "FAILED: promote.mjs refused -- nothing was promoted"
    exit 1
  fi
  verdict committedInSync promoted
  report 2> /dev/null || { echo "FAILED: promoted, but the final report could not be regenerated"; exit 1; }
  cp "$OUT/pipeline_report.json" "$MAPS/pipeline_report.json"
else
  report
fi

[ "$rc" -eq 0 ] || { echo "FAILED"; exit 1; }
echo "DONE -> $OUT"
