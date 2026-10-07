#!/usr/bin/env bash
# Instrument the reconstructed daemon once, then run every scenario (or the
# ones named). Outputs under $OUT/scenarios/<name>/.
#   PKG=<scratch dist/release> bash scenarios/run.sh [01-boot ...]
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
RECON="$(cd "$HERE/.." && pwd)"
OUT="${OUT:-$RECON/.build}"
PKG="${PKG:-/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release}"
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 22 >/dev/null 2>&1 || true
[ -f "$PKG/daemon.js" ] || { echo "PKG=$PKG is not a dist/release dir"; exit 2; }
# instrument once; scenarios run side by side and must not rewrite the file
# another daemon is loading. Re-instrument when the recon, the index or the
# tool is newer than the traced file.
T="$PKG/daemon.traced.js"
if [ ! -f "$T" ] || [ "$RECON/recon/daemon.recon.js" -nt "$T" ] || [ "$RECON/maps/symbols_daemon.json" -nt "$T" ] || [ "$RECON/tools/instrument.mjs" -nt "$T" ]; then
  node "$RECON/tools/instrument.mjs" "$RECON/recon/daemon.recon.js" "$RECON/maps/symbols_daemon.json" "$T.tmp" --inner && mv "$T.tmp" "$T"
fi
if [ $# -gt 0 ]; then list=("$@"); else list=($(cd "$HERE" && ls [0-9]*-*.sh | sed 's/\.sh$//')); fi
rc=0
for s in "${list[@]}"; do
  OUT="$OUT" PKG="$PKG" bash "$HERE/$s.sh" || { echo "!! $s failed"; rc=1; }
done
exit $rc
