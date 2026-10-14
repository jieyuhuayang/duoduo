#!/usr/bin/env bash
# Build the release history of the daemon bundle: every published release,
# beautified with the pinned js-beautify, paired release to release, and the
# chain of each current first-party symbol walked back to its first release.
#
#   bash tools/history.sh                 # all releases, into $OUT/history (default reconstruction/.build/history)
#   bash tools/history.sh --write         # also write maps/history_daemon.json
#   bash tools/history.sh --build <OUT> --write
#                                         # mid-bump: chain from <OUT>/rename_daemon.json, the
#                                         # check-mode run's map of the new release, so the one
#                                         # PROMOTE carries the history into first-party/
#
# Steps (each is skipped when its output exists, so a rerun after a new release
# only fetches and pairs the new one):
#   1. versions.txt   npm's release list (plain X.Y.Z only; pre-releases are not releases)
#   2. pretty/<v>.pretty.js   daemon.js of each release, beautified (the tarball is kept in tarballs/)
#   3. fp/<a>__<b>.json       fingerprint_match.mjs for each consecutive pair
#   4. pairs/<a>__<b>.json    pair_changes.mjs for each consecutive pair
#   5. features/<v>.json      decl_features.mjs for each release
#   6. history_daemon.json    history_chain.mjs over all of it, for maps/rename_daemon.json
# The current rename map must describe the newest release in versions.txt;
# otherwise the chain starts from the wrong bundle and the script refuses. That
# map is maps/rename_daemon.json, or with --build the one a check-mode rebuild.sh
# wrote into <OUT> (its symbols_daemon.json records the release). Without
# --build a bump needed two promotes: maps/ only describes the new release after
# the first, and the history it then allowed changed every first-party header's
# `// since:` line, so a second PROMOTE had to carry it (v0.8.5). Run it after
# the last name_symbol.mjs of the bump: a newly named symbol needs its chain.
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
RECON="$(cd "$HERE/.." && pwd)"
OUT="${OUT:-$RECON/.build}/history"
PACKAGE="${PACKAGE:-@openduo/duoduo}"
WRITE=0
BUILD=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --write) WRITE=1 ;;
    --build) BUILD="$(cd "$2" && pwd)"; shift ;;
    *) echo "unknown argument $1"; exit 2 ;;
  esac
  shift
done
if [ -n "$BUILD" ]; then
  RENAME="$BUILD/rename_daemon.json"
  [ -f "$RENAME" ] && [ -f "$BUILD/symbols_daemon.json" ] || { echo "no $BUILD/rename_daemon.json or symbols_daemon.json: run rebuild.sh (OUT=$BUILD) first"; exit 2; }
  COMMITTED="$(node -p 'require(process.argv[1]).version' "$BUILD/symbols_daemon.json")"
  SOURCE="$BUILD (check-mode run)"
else
  RENAME="$RECON/maps/rename_daemon.json"
  COMMITTED="$(node -p 'require(process.argv[1]).package' "$RECON/maps/pipeline_report.json")"
  SOURCE="maps/"
fi
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 22 >/dev/null 2>&1 || true
BEAUTIFY="$HERE/node_modules/.bin/js-beautify"
[ -x "$BEAUTIFY" ] || { echo "js-beautify missing -- run: (cd $HERE && npm ci)"; exit 1; }
mkdir -p "$OUT/tarballs" "$OUT/pretty" "$OUT/fp" "$OUT/pairs" "$OUT/features"
cd "$OUT"

# 1. releases
npm view "$PACKAGE" versions --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).filter(v=>/^\d+\.\d+\.\d+$/.test(v)).join("\n")))' > versions.txt
NEWEST="$(tail -1 versions.txt)"
[ "v$NEWEST" = "$COMMITTED" ] || { echo "newest release is $NEWEST but $SOURCE describes $COMMITTED: bump first, or mid-bump pass --build <the check-mode run's OUT> (the chain must start from a rename map of the newest release)"; exit 1; }
echo "releases: $(wc -l < versions.txt) (newest $NEWEST)"

# 2. fetch + beautify
fetch_one() {
  local v="$1"
  [ -s "pretty/$v.pretty.js" ] && return 0
  mkdir -p "tarballs/$v"
  if [ ! -s "tarballs/$v/package/dist/release/daemon.js" ]; then
    curl -sL "$(npm view "$PACKAGE@$v" dist.tarball)" -o "tarballs/$v/pkg.tgz"
    tar -xzf "tarballs/$v/pkg.tgz" -C "tarballs/$v" package/dist/release/daemon.js package/package.json
  fi
  node --max-old-space-size=8192 "$BEAUTIFY" "tarballs/$v/package/dist/release/daemon.js" > "pretty/$v.pretty.js.tmp" && mv "pretty/$v.pretty.js.tmp" "pretty/$v.pretty.js"
  echo "  beautified $v ($(wc -l < "pretty/$v.pretty.js") lines)"
}
export -f fetch_one; export BEAUTIFY PACKAGE
xargs -P "${JOBS:-8}" -I{} bash -c 'fetch_one {}' < versions.txt

# 3-5. pair consecutive releases, extract features
prev=""
while read -r v; do
  [ -s "features/$v.json" ] || node --max-old-space-size=4096 "$HERE/decl_features.mjs" "pretty/$v.pretty.js" "features/$v.json" > /dev/null
  if [ -n "$prev" ]; then
    [ -s "fp/${prev}__${v}.json" ] || node --max-old-space-size=8192 "$HERE/fingerprint_match.mjs" "pretty/$prev.pretty.js" "pretty/$v.pretty.js" "fp/${prev}__${v}.json" > /dev/null
    [ -s "pairs/${prev}__${v}.json" ] || node --max-old-space-size=8192 "$HERE/pair_changes.mjs" "pretty/$prev.pretty.js" "pretty/$v.pretty.js" "fp/${prev}__${v}.json" "pairs/${prev}__${v}.json" 2> /dev/null
  fi
  prev="$v"
done < versions.txt

# 6. the chain
node "$HERE/history_chain.mjs" "$OUT" "$RENAME" "$OUT/history_daemon.json" --package "$PACKAGE"
if [ "$WRITE" = 1 ]; then
  node "$HERE/history_chain.mjs" "$OUT" "$RENAME" "$RECON/maps/history_daemon.json" --package "$PACKAGE" --slim
  echo "wrote $RECON/maps/history_daemon.json"
fi
