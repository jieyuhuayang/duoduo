#!/usr/bin/env bash
# Retarget the reconstruction from one upstream release to the next.
#
# rebuild.sh alone is NOT enough for a version bump. esbuild re-mangles every
# identifier on every build, so the RE-inferred name map (maps/inferred_*.json)
# is keyed by short names that now mean something else — reusing it verbatim
# silently mislabels code. This script does the bump correctly:
#
#   1. structural fingerprint match between the two releases
#   2. carry the inferred names across on structural identity, not on name
#   3. pair the changed/added declarations so the delta is reviewable
#   4. emit per-declaration cross-version diffs (alpha-normalized + literal delta)
#   5. hand off to rebuild.sh for the usual split -> cmp -> rename -> AST-equiv proof
#
# Anything reported as RE-ANCHOR in step 2 needs a human/agent pass with
# locate_by_anchor.mjs (pick a string literal unique to that function, look it
# up in the new bundle) before step 5 is trustworthy.
#
# Usage:
#   OLD=/path/to/beautified/v0.6.1 NEW=/path/to/beautified/v0.6.2 bash bump.sh
# where each dir holds {daemon,cli,stdio}.pretty.js.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OLD="${OLD:?set OLD=dir with the previous release's *.pretty.js}"
NEW="${NEW:?set NEW=dir with the new release's *.pretty.js}"
OUT="${OUT:-$HERE/../.build/bump}"
MAPS="$HERE/../maps"
mkdir -p "$OUT"

for name in daemon cli stdio; do
  echo "==== $name ===="
  [ -f "$OLD/$name.pretty.js" ] && [ -f "$NEW/$name.pretty.js" ] || { echo "  missing input, skipped"; continue; }
  if cmp -s "$OLD/$name.pretty.js" "$NEW/$name.pretty.js"; then
    echo "  unchanged between releases (byte-identical) — nothing to re-derive"
    continue
  fi

  echo "-- structural fingerprint match"
  node --max-old-space-size=8192 "$HERE/fingerprint_match.mjs" \
    "$OLD/$name.pretty.js" "$NEW/$name.pretty.js" "$OUT/fp_$name.json"

  INF="$MAPS/inferred_$name.json"
  if [ -f "$INF" ]; then
    echo "-- carry inferred names across the bump"
    node "$HERE/remap_inferred.mjs" "$OUT/fp_$name.json" "$INF" "$OUT/inferred_$name.json"
    echo "   review $OUT/inferred_$name.json, then: cp $OUT/inferred_$name.json $INF"
  fi

  echo "-- pair changed/added declarations"
  node --max-old-space-size=8192 "$HERE/pair_changes.mjs" \
    "$OLD/$name.pretty.js" "$NEW/$name.pretty.js" "$OUT/fp_$name.json" "$OUT/pairs_$name.json"

  echo "-- emit per-declaration cross-version diffs"
  node --max-old-space-size=8192 "$HERE/diff_decls.mjs" \
    "$OLD/$name.pretty.js" "$NEW/$name.pretty.js" "$OUT/pairs_$name.json" "$OUT/diff/$name" \
    "$MAPS/rename_$name.json" "$MAPS/rename_$name.json"

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

echo
echo "review the diffs under $OUT/diff/, update maps/inferred_*.json, then:"
echo "  BEAUTIFIED=$NEW bash $HERE/rebuild.sh"
