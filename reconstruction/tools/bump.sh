#!/usr/bin/env bash
# Retarget the reconstruction from one upstream release to the next.
#
# rebuild.sh alone is NOT enough for a version bump. esbuild re-mangles every
# identifier on every build, so the RE-inferred name map (maps/inferred_*.json)
# is keyed by short names that now mean something else — reusing it verbatim
# silently mislabels code. This script does the bump correctly:
#
#   0. check that OLD is the release the committed maps describe
#   1. structural fingerprint match between the two releases
#   2. carry the inferred names across on structural identity, not on name
#   3. run the module gate on NEW and build NEW's own rename map, then list the
#      first-party names that still need a subsystem
#   4. pair the changed/added declarations so the delta is reviewable
#   5. emit per-declaration cross-version diffs (alpha-normalized + literal delta),
#      each side labelled with ITS OWN release's real names
#   6. hand off, printing the rest of the bump in the order the gates accept:
#      record the inferred-name baseline, a check-mode rebuild.sh (with PKG, so
#      the beautify-fidelity proof runs), retarget the docs against that run,
#      and only then PROMOTE=1
#
# Anything reported as RE-ANCHOR in step 2 needs a human/agent pass with
# locate_by_anchor.mjs (pick a string literal unique to that function, look it
# up in the new bundle) before step 6 is trustworthy. Inferred names also sit on
# module initialisers (init...Module) and literal constants (UPPER_SNAKE; see
# verify_inferred.mjs). An initialiser's fingerprint covers the list of modules
# it initialises, so one new import makes it RE-ANCHOR: relocate it on a string
# literal it assigns. A constant carries across only when its literal is
# unchanged (and, AMBIGUOUS, not when another constant now has the same one);
# a changed literal is a changed constant, which verify_inferred.mjs refuses
# until the citations of it are re-read and the baseline re-recorded.
# locate_by_anchor.mjs prints the kind of each hit; record a hit only for a
# name of that kind.
#
# The hand-off order is not a preference. PROMOTE=1 is refused unless
# docs/.pretty-anchor-target already names the new release (rebuild.sh
# preflight) and every verdict is `pass` (promote.mjs), and an unrecorded
# inferred-name baseline is `warn`. The hand-off used to print PROMOTE first,
# the baseline after it and no doc step at all, so following it line by line
# on a real bump was refused at the preflight every time.
#
# Why step 0 and step 3 exist:
#   - the OLD side of every step here is read through the COMMITTED maps (rename,
#     inferred, exports). If OLD is not the release those maps were generated
#     from, every old-side label is another function's name, and remap_inferred
#     carries names from the wrong base. bundle_guard.mjs proves the match: each
#     committed symbol's short name must sit on its recorded line of OLD.
#   - diff_decls used to get the OLD rename map for BOTH sides, so every new
#     short name was labelled with whatever that spelling meant in the previous
#     release -- the `nX` hazard remap_inferred.mjs exists to prevent (v0.6.1
#     rehydrateSessionState, v0.6.2 the trace logger). NEW's labels now come from
#     NEW's own export blocks plus the carried inferred names.
#
# Usage (each side: a dir of *.pretty.js, or the shipped dist/release dir):
#   OLD=<dir> NEW=<dir> [PKG_NEW=<dist/release>] bash bump.sh
#   PKG_OLD=<dist/release> PKG_NEW=<dist/release> bash bump.sh
# PKG_* sides are beautified here with the pinned js-beautify. Given both NEW
# and PKG_NEW, NEW is first proven to be PKG_NEW beautified (ast_equiv.mjs).
# Without PKG_NEW nothing ties NEW to a release, and the printed hand-off needs
# the release's dist/release dir filled in: `BEAUTIFIED=$NEW` alone skips the
# beautify-fidelity proof and stamps the build "unrecorded".
# Only daemon and cli are processed -- the same NAMES as rebuild.sh; the other
# bundles carry no first-party export table to retarget.
# Writes only under $OUT (default reconstruction/.build/bump); never into maps/.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${OUT:-$HERE/../.build/bump}"
MAPS="${MAPS:-$HERE/../maps}"
DOCS="$(cd "$HERE/../.." && pwd)/docs"
NAMES=(daemon cli)
mkdir -p "$OUT"
BEAUTIFY="$HERE/node_modules/.bin/js-beautify"

COMMITTED_VERSION="$(node -p 'try { require(require("path").resolve(process.argv[1])).package } catch { "" }' "$MAPS/pipeline_report.json")"
pkg_version() { node -p 'require(require("path").resolve(process.argv[1])).version' "$1/../../package.json" 2>/dev/null || echo "?"; }

# beautify <dist/release dir> <outdir>: the same pinned formatter as rebuild.sh
beautify() {
  [ -x "$BEAUTIFY" ] || { echo "js-beautify missing -- run: (cd $HERE && npm ci)"; exit 1; }
  mkdir -p "$2"
  for name in "${NAMES[@]}"; do
    node --max-old-space-size=8192 "$BEAUTIFY" "$1/$name.js" > "$2/$name.pretty.js"
  done
}

if [ -z "${OLD:-}" ]; then
  if [ -z "${PKG_OLD:-}" ]; then
    echo "set OLD=dir with the previous release's *.pretty.js, or PKG_OLD=its dist/release dir, e.g."
    echo "  npm install --prefix /tmp/duoduo-old @openduo/duoduo@${COMMITTED_VERSION#v} --ignore-scripts"
    echo "  PKG_OLD=/tmp/duoduo-old/node_modules/@openduo/duoduo/dist/release"
    exit 2
  fi
  echo "==== beautify OLD ($PKG_OLD, v$(pkg_version "$PKG_OLD")) ===="
  OLD="$OUT/pretty_old"; beautify "$PKG_OLD" "$OLD"
fi
NEW_GIVEN="${NEW:-}"
if [ -z "$NEW_GIVEN" ]; then
  PKG_NEW="${PKG_NEW:?set NEW=dir with the new release *.pretty.js, or PKG_NEW=its dist/release dir}"
  echo "==== beautify NEW ($PKG_NEW, v$(pkg_version "$PKG_NEW")) ===="
  NEW="$OUT/pretty_new"; beautify "$PKG_NEW" "$NEW"
fi
for name in "${NAMES[@]}"; do
  for side in "$OLD" "$NEW"; do
    [ -f "$side/$name.pretty.js" ] || { echo "missing $side/$name.pretty.js"; exit 2; }
  done
done
if [ -n "$NEW_GIVEN" ] && [ -n "${PKG_NEW:-}" ]; then
  echo "==== NEW is PKG_NEW beautified? (ast_equiv) ===="
  for name in "${NAMES[@]}"; do
    node --max-old-space-size=8192 "$HERE/ast_equiv.mjs" "$PKG_NEW/$name.js" "$NEW/$name.pretty.js" | sed "s/^/  $name: /"
  done
fi

# 0. OLD must be the release the committed maps describe
echo "==== OLD vs committed maps ($COMMITTED_VERSION) ===="
for name in "${NAMES[@]}"; do
  node --input-type=module -e '
    const [guard, pretty, index] = process.argv.slice(1);
    const { pathToFileURL } = await import("node:url");
    const fs = await import("node:fs");
    const { assertBundleMatchesIndex, loadIndex } = await import(pathToFileURL(guard).href);
    assertBundleMatchesIndex(fs.readFileSync(pretty, "utf8").split("\n"), loadIndex(index), pretty);
  ' "$HERE/bundle_guard.mjs" "$OLD/$name.pretty.js" "$MAPS/symbols_$name.json" \
    || { echo "  $name: OLD is not the release maps/ was generated from -- bump from $COMMITTED_VERSION"; exit 1; }
  echo "  $name: OLD matches maps/symbols_$name.json"
done

gate_failed=()
changed=()   # bundles with an fp_/pairs_ file, i.e. whose doc line numbers move
for name in "${NAMES[@]}"; do
  echo "==== $name ===="
  if cmp -s "$OLD/$name.pretty.js" "$NEW/$name.pretty.js"; then
    echo "  unchanged between releases (byte-identical) — nothing to re-derive"
    continue
  fi
  changed+=("$name")

  echo "-- structural fingerprint match"
  node --max-old-space-size=8192 "$HERE/fingerprint_match.mjs" \
    "$OLD/$name.pretty.js" "$NEW/$name.pretty.js" "$OUT/fp_$name.json"

  INF="$MAPS/inferred_$name.json"
  NEW_INF="$OUT/inferred_$name.json"
  rm -f "$NEW_INF"
  if [ -f "$INF" ]; then
    echo "-- carry inferred names across the bump"
    node "$HERE/remap_inferred.mjs" "$OUT/fp_$name.json" "$INF" "$NEW_INF"
    echo "   review $NEW_INF, then: cp $NEW_INF $INF"
  fi

  # NEW's own names: its export blocks through the module gate, plus the carried
  # inferred names. A gate failure is the expected signal for a new upstream
  # module, not a reason to stop reviewing the rest -- the NEW side just goes
  # unlabelled until maps/modules_$name.json records a decision for it.
  echo "-- module gate + rename map on NEW"
  NEW_MAP="$OUT/rename_$name.new.json"
  rm -f "$NEW_MAP"
  node --max-old-space-size=8192 "$HERE/export_blocks.mjs" "$NEW/$name.pretty.js" --json "$OUT/blocks_$name.new.json"
  if ! node "$HERE/build_rename.mjs" "$OUT/blocks_$name.new.json" "$MAPS/modules_$name.json" "$NEW_INF" "$NEW_MAP"; then
    gate_failed+=("$name")
    rm -f "$NEW_MAP"
    echo "   module gate FAILED on NEW: decide the block(s) above in maps/modules_$name.json; NEW-side diff labels are omitted"
  fi

  # the same completeness rule extract_functions.mjs enforces at rebuild time.
  # A name remap_inferred.mjs reported RE-ANCHOR is in the old inferred map and
  # not (yet) in the carried one, so NEW's rename map lacks it -- but the
  # function is usually still there, only unlocated (v0.8.2 -> v0.8.3:
  # drainSessionMailbox). It used to be listed as "gone upstream, drop from the
  # subsystem map"; doing that left the name without a subsystem once it was
  # re-anchored, and extract_functions.mjs then failed the rebuild.
  SUB="$MAPS/subsys_$name.json"
  if [ -f "$NEW_MAP" ] && [ -f "$SUB" ]; then
    node -e '
      const fs = require("fs");
      const read = (p) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
      const [map, sub, oldInf, newInf] = process.argv.slice(1).map(read);
      const real = new Set(Object.values(map));
      const carried = new Set(Object.values(newInf));
      const reanchor = new Set(Object.values(oldInf).filter(n => !carried.has(n)));
      const unfiled = [...real].filter(n => !Object.hasOwn(sub, n)).sort();
      const missing = Object.keys(sub).filter(n => !real.has(n));
      const pending = missing.filter(n => reanchor.has(n)).sort();
      const gone = missing.filter(n => !reanchor.has(n)).sort();
      console.error(`   need a subsystem (${unfiled.length}): ${unfiled.join(", ") || "(none)"}`);
      console.error(`   RE-ANCHOR pending, keep the subsystem entry (${pending.length}): ${pending.join(", ") || "(none)"}`);
      console.error(`   gone upstream, drop from the subsystem map (${gone.length}): ${gone.join(", ") || "(none)"}`);
    ' "$NEW_MAP" "$SUB" "$INF" "$NEW_INF"
  fi

  echo "-- pair changed/added declarations"
  node --max-old-space-size=8192 "$HERE/pair_changes.mjs" \
    "$OLD/$name.pretty.js" "$NEW/$name.pretty.js" "$OUT/fp_$name.json" "$OUT/pairs_$name.json"

  echo "-- emit per-declaration cross-version diffs"
  node --max-old-space-size=8192 "$HERE/diff_decls.mjs" \
    "$OLD/$name.pretty.js" "$NEW/$name.pretty.js" "$OUT/pairs_$name.json" "$OUT/diff/$name" \
    "$MAPS/rename_$name.json" "$NEW_MAP"

  echo "-- authoritative export-name delta (added/removed real names)"
  node "$HERE/exports_map.mjs" "$NEW/$name.pretty.js" > "$OUT/$name.exports.new.json" 2>/dev/null
  node -e '
    const fs=require("fs");
    const [a,b]=process.argv.slice(1);
    const A=Object.keys(JSON.parse(fs.readFileSync(a,"utf8")));
    const B=Object.keys(JSON.parse(fs.readFileSync(b,"utf8")));
    const sa=new Set(A), sb=new Set(B);
    const add=B.filter(x=>!sa.has(x)), del=A.filter(x=>!sb.has(x));
    console.error("   + " + (add.length?add.join(", "):"(none)"));
    console.error("   - " + (del.length?del.join(", "):"(none)"));
  ' "$MAPS/$name.exports.json" "$OUT/$name.exports.new.json"
done

# 6. the hand-off, in the only order the gates accept (header)
if [ -n "${PKG_NEW:-}" ]; then P="$PKG_NEW" V="v$(pkg_version "$PKG_NEW")"
else P="<the new release's dist/release dir>" V="<vX.Y.Z>"; fi
R="$(cd "$HERE/.." && pwd)/.build"   # the check-mode run's OUT: the docs are retargeted against its artifacts
echo
echo "review the diffs under $OUT/diff/, relocate every RE-ANCHOR name, copy the reviewed"
echo "inferred map(s) into maps/, file new first-party names under a subsystem, then, in this order:"
echo "  1. record the reviewed inferred names as the shape baseline (an unrecorded one is"
echo "     inferredNames=warn, which promote.mjs refuses):"
echo "     PKG_VERSION=$V node $HERE/verify_inferred.mjs record $NEW/daemon.pretty.js $MAPS/inferred_daemon.json $MAPS/inferred_daemon.shape.json"
echo "  2. a check-mode run; committedInSync=retarget-pending and failing citations/line anchors"
echo "     are expected here -- it produces the index step 3 retargets the docs against:"
echo "     OUT=$R PKG=$P bash $HERE/rebuild.sh"
[ -n "${PKG_NEW:-}" ] || echo "     (BEAUTIFIED=$NEW alone would skip the beautify-fidelity proof and stamp the build \"unrecorded\")"
echo "  3. retarget the docs to $V against that run (retarget_docs apply is one-shot, so it comes"
echo "     before verify_citations --fix writes new line numbers):"
if [ "${#changed[@]}" -gt 0 ]; then
  spec=""
  for name in "${changed[@]}"; do
    echo "     node $HERE/retarget_docs.mjs collect --scope $name $DOCS/*.md > $OUT/doclines_$name.txt"
    echo "     node $HERE/remap_doc_anchors.mjs $OLD/$name.pretty.js $NEW/$name.pretty.js $OUT/fp_$name.json $OUT/doclines_$name.txt $OUT/docmap_$name.json $OUT/pairs_$name.json"
    spec="${spec:+$spec,}$name=$OUT/docmap_$name.json"
  done
  echo "     node $HERE/retarget_docs.mjs apply --stamp $V $spec $DOCS/*.md"
else
  echo "     (no bundle changed, so no line moved) echo $V > $DOCS/.pretty-anchor-target"
fi
echo "     node $HERE/retarget_symbols.mjs $MAPS/rename_daemon.json $R/rename_daemon.json $DOCS/*.md"
echo "     node $HERE/verify_citations.mjs $R/symbols_daemon.json,$R/symbols_cli.json --bundle daemon=$R/beautified/$V/daemon.pretty.js --bundle cli=$R/beautified/$V/cli.pretty.js --fix $DOCS/*.md"
echo "     (retarget_symbols takes one bundle's maps; a stale cli short name is left for"
echo "     verify_citations to report, and a stale short name quoted mid-snippet for check_bare_anchors)"
echo "  4. once the docs pass verify_citations and the line-anchor checks, promote. It runs every"
echo "     gate against the candidate artifacts and writes nothing unless all of them pass:"
echo "     PROMOTE=1 PKG=$P bash $HERE/rebuild.sh"
if [ "${#gate_failed[@]}" -gt 0 ]; then
  echo
  echo "MODULE GATE FAILED on NEW for: ${gate_failed[*]} -- rebuild.sh will stop at the same place until maps/modules_*.json decides those blocks"
  exit 1
fi
