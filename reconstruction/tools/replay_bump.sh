#!/usr/bin/env bash
# Replay one upstream bump against the committed record of both releases and
# score the automatic re-anchoring.
#
# Why this exists: each bump tool (remap_inferred, align_releases, pair_releases,
# anchor_candidates, confirm_reanchor) was validated on a replay of one or two
# bumps with a throwaway script, and the numbers in README.md「已实现」could not
# be re-measured after a change. This script is the harness those replays
# share: it runs bump.sh exactly as a bump would, with the maps committed for
# OLD as input (MAPS=), and replay_score.mjs compares the result with the maps
# committed for NEW, which were reviewed by hand and are the truth. Run it on
# every pair in the fixture before and after changing any bump tool; a verdict
# that moves away from `*-correct`, and above all any `carried-wrong`, is a
# regression (VERIFICATION.md 第 5 节 lists the baseline).
#
# What it does, per pair:
#   1. bump.sh with MAPS=<fixture>/<vOLD>/reconstruction/maps, PKG_OLD and
#      PKG_NEW from the fixture's scratch installs (a missing one is installed
#      with --ignore-scripts), DOCS=<fixture>/<vOLD>/docs when present (so the
#      impact report reads the docs of OLD, as a real bump would). bump.sh ends
#      with exit 1 when NEW's module gate fails against OLD's modules map; that
#      is expected for a release that adds a module, and the carry, pairing and
#      confirmation outputs exist all the same, so the run goes on. Its step 0
#      refusing OLD (bundle_guard.mjs, or the inferred map not describing OLD)
#      is recorded in refused.txt and the pair is skipped.
#   2. confirm_reanchor.mjs --json per bundle (no --write, no --accept): the
#      witness-confirmed set, i.e. what a reviewer gets without reading a body.
#      bump.sh writes the same file; it is re-run here so the score does not
#      depend on where bump.sh stopped.
#   3. replay_score.mjs -> score.json (every per-name verdict) and score.md.
#
# Usage:
#   bash replay_bump.sh <vOLD> <vNEW> [--out <dir>] [--fixture <dir>]
# Defaults: fixture reconstruction/.build/replay (maps under <vX>/reconstruction/maps
# and docs under <vX>/docs, exported from the release's commit when missing;
# packages under pkg/<X>/node_modules/@openduo/duoduo/dist/release, installed
# when missing), out <fixture>/runs/<vOLD>__<vNEW>. Writes only under <out> and
# the missing fixture parts; never into maps/ or docs/. Exit 0 when scored, 3
# when the pair was refused at step 0, 2 on a usage or fixture error.
# Takes one to two minutes per pair; bump.sh's beautifier needs up to 8 GB.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
RECON="$(cd "$HERE/.." && pwd)"
ROOT="$(cd "$RECON/.." && pwd)"
FIXTURE="$RECON/.build/replay"
OUTDIR=""
POS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --out) OUTDIR="$2"; shift 2 ;;
    --fixture) FIXTURE="$2"; shift 2 ;;
    *) POS+=("$1"); shift ;;
  esac
done
if [ "${#POS[@]}" -ne 2 ]; then
  echo "usage: bash replay_bump.sh <vOLD> <vNEW> [--out <dir>] [--fixture <dir>]" >&2
  exit 2
fi
VOLD="${POS[0]}"; VNEW="${POS[1]}"
VOLD="v${VOLD#v}"; VNEW="v${VNEW#v}"
[ -n "$OUTDIR" ] || OUTDIR="$FIXTURE/runs/${VOLD}__${VNEW}"
OLD_MAPS="$FIXTURE/$VOLD/reconstruction/maps"
NEW_MAPS="$FIXTURE/$VNEW/reconstruction/maps"
OLD_DOCS="$FIXTURE/$VOLD/docs"

# the committed record of a release: reconstruction/maps and docs as of the last
# commit on origin/main (else HEAD) whose docs/.pretty-anchor-target and
# maps/pipeline_report.json both name it. Exported with git archive when the
# fixture lacks it; for v0.8.3..v0.8.7 the export equals the fixture byte for byte.
fixture_release() {
  local v="$1" dir="$FIXTURE/$1"
  [ -f "$dir/reconstruction/maps/pipeline_report.json" ] && return 0
  local ref="origin/main"
  git -C "$ROOT" rev-parse -q --verify "$ref" >/dev/null || ref=HEAD
  local commit=""
  while read -r h; do
    [ "$(git -C "$ROOT" show "$h:docs/.pretty-anchor-target" 2>/dev/null)" = "$v" ] || continue
    [ "$(git -C "$ROOT" show "$h:reconstruction/maps/pipeline_report.json" 2>/dev/null | node -p 'try { JSON.parse(require("fs").readFileSync(0, "utf8")).package } catch { "" }')" = "$v" ] || continue
    commit="$h"; break
  done < <(git -C "$ROOT" log --format=%H "$ref" -- docs/.pretty-anchor-target reconstruction/maps/pipeline_report.json)
  [ -n "$commit" ] || { echo "no commit on $ref records $v (docs/.pretty-anchor-target and maps/pipeline_report.json)" >&2; return 1; }
  echo "exporting the committed record of $v from $commit into $dir" >&2
  mkdir -p "$dir"
  git -C "$ROOT" archive "$commit" reconstruction/maps docs | tar -x -C "$dir"
  echo "$commit" > "$dir/COMMIT"
}
fixture_release "$VOLD" || exit 2
fixture_release "$VNEW" || exit 2

# the shipped release, installed into the fixture when missing
pkg_release() {
  local v="${1#v}" prefix="$FIXTURE/pkg/${1#v}"
  local rel="$prefix/node_modules/@openduo/duoduo/dist/release"
  if [ ! -f "$rel/daemon.js" ]; then
    echo "installing @openduo/duoduo@$v into $prefix" >&2
    mkdir -p "$prefix"
    npm install --prefix "$prefix" "@openduo/duoduo@$v" --ignore-scripts --no-audit --no-fund >&2 || { echo "install failed" >&2; exit 2; }
  fi
  echo "$rel"
}
PKG_OLD="$(pkg_release "$VOLD")" || exit 2
PKG_NEW="$(pkg_release "$VNEW")" || exit 2

mkdir -p "$OUTDIR"
BUMP="$OUTDIR/bump"
rm -rf "$BUMP" "$OUTDIR/refused.txt" "$OUTDIR/score.json" "$OUTDIR/score.md"
echo "==== replay $VOLD -> $VNEW ===="
echo "  maps:   $OLD_MAPS"
echo "  truth:  $NEW_MAPS"
echo "  out:    $OUTDIR"
start=$(date +%s)
env_docs=()
[ -d "$OLD_DOCS" ] && env_docs=(DOCS="$OLD_DOCS")
env MAPS="$OLD_MAPS" OUT="$BUMP" PKG_OLD="$PKG_OLD" PKG_NEW="$PKG_NEW" "${env_docs[@]}" \
  bash "$HERE/bump.sh" > "$OUTDIR/bump.log" 2>&1
rc=$?
echo "  bump.sh exit $rc in $(( $(date +%s) - start )) s (log: $OUTDIR/bump.log)"
if [ ! -f "$BUMP/fp_daemon.json" ] && [ ! -f "$BUMP/fp_cli.json" ]; then
  # nothing was carried: step 0 refused OLD, or beautifying failed
  {
    echo "replay $VOLD -> $VNEW refused before the carry step (bump.sh exit $rc):"
    grep -E "OLD is not the release|does not describe OLD|missing |js-beautify missing" "$OUTDIR/bump.log" || tail -5 "$OUTDIR/bump.log"
  } | tee "$OUTDIR/refused.txt"
  exit 3
fi
if [ "$rc" -ne 0 ]; then
  if grep -q "MODULE GATE FAILED" "$OUTDIR/bump.log"; then
    echo "  module gate failed on $VNEW against $VOLD's modules map (expected for a release that adds a module); the carry outputs exist, scoring goes on"
  else
    echo "  bump.sh did not finish (see the log); scoring what exists"
  fi
fi

# the witness-confirmed set per bundle, without --write or --accept
for name in daemon cli; do
  [ -f "$BUMP/inferred_$name.json" ] || continue
  node --max-old-space-size=8192 "$HERE/confirm_reanchor.mjs" --impact "$BUMP/impact.json" --bundle "$name" \
    --proposed "$BUMP/inferred_$name.proposed.json" --json "$BUMP/reanchor_$name.json" \
    "$BUMP/pretty_old/$name.pretty.js" "$BUMP/pretty_new/$name.pretty.js" > "$OUTDIR/confirm_$name.log" 2>&1 \
    || echo "  confirm_reanchor $name exit $? (see $OUTDIR/confirm_$name.log)"
done

node "$HERE/replay_score.mjs" --old-maps "$OLD_MAPS" --new-maps "$NEW_MAPS" --bump "$BUMP" \
  --old-label "$VOLD" --new-label "$VNEW" --json "$OUTDIR/score.json" --md "$OUTDIR/score.md"
echo "  score: $OUTDIR/score.json, $OUTDIR/score.md"
