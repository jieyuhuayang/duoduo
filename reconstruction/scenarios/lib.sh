#!/usr/bin/env bash
# Shared harness for the scenario scripts: boot the instrumented reconstructed
# daemon in an isolated HOME, talk to its two listeners, mark steps in the
# trace, and write the report. Source it from a scenario:
#
#   source "$(dirname "$0")/lib.sh"
#   scenario_init 01-boot
#   daemon_start                       # extra env as VAR=value arguments
#   mark "rpc system.status"
#   rpc_tcp system.status '{}'
#   daemon_stop
#   report
#
# Every scenario writes under $OUT/scenarios/<name>/: boot.log, trace.jsonl,
# report.md, report.json, and whatever the scenario saves with `save <file>`.
# Nothing here touches the real daemon: HOME is a fresh directory under
# $OUT, the TCP port is $ALADUO_PORT (default 20333), and the daemon is started
# with `node`, never with the CLI (which drives launchd / the real install).
#
# Prerequisites (run.sh does them): $PKG is the scratch install's dist/release,
# and $PKG/daemon.traced.js is instrument.mjs's output.
set -u
source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 22 >/dev/null 2>&1 || true

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECON="$(cd "$LIB_DIR/.." && pwd)"
TOOLS="$RECON/tools"
OUT="${OUT:-$RECON/.build}"
PKG="${PKG:-/tmp/duoduo-pkg/node_modules/@openduo/duoduo/dist/release}"
TRACED="${TRACED:-$PKG/daemon.traced.js}"
# each scenario gets its own TCP port (20300 + its number) so scenarios can run
# side by side; ALADUO_PORT in the environment overrides it
PORT_OVERRIDE="${ALADUO_PORT:-}"

scenario_init() {
  SCENARIO="$1"
  ALADUO_PORT="${PORT_OVERRIDE:-$((20300 + 10#${SCENARIO%%-*}))}"
  SDIR="$OUT/scenarios/$SCENARIO"
  rm -rf "$SDIR"; mkdir -p "$SDIR"
  # keep ISO short: <HOME>/.aladuo/run/daemon.sock must stay under the 104-byte unix socket limit
  ISO="/tmp/duo-iso-$$-${SCENARIO%%-*}"
  rm -rf "$ISO"; mkdir -p "$ISO/work"; chmod 700 "$ISO"
  TRACE="$SDIR/trace.jsonl"; : > "$TRACE"
  SOCK="$ISO/.aladuo/run/daemon.sock"
  DPID=""
  trap 'daemon_stop >/dev/null 2>&1; rm -rf "$ISO"' EXIT
  echo "== scenario $SCENARIO  (HOME=$ISO, port $ALADUO_PORT, out $SDIR)"
}

# daemon_start [VAR=value ...]: boots the traced daemon and waits for the socket
daemon_start() {
  [ -f "$TRACED" ] || { echo "no $TRACED -- run scenarios/run.sh"; exit 1; }
  # ALADUO_WORK_DIR defaults to the daemon's current directory, which here is
  # the scratch install; received attachments would land in $PKG/inbox.
  # The auth source defaults to an API key that cannot work, so no scenario can
  # reach a model by accident (a partition or channel session would otherwise
  # spend the machine's real Claude credentials). A scenario that wants a real
  # model passes ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local explicitly.
  # The subshell execs node, so $! is node's pid and SIGTERM reaches it.
  ( cd "$PKG" && exec env HOME="$ISO" ALADUO_PORT="$ALADUO_PORT" ALADUO_BOOTSTRAP_DIR="$PKG/../../bootstrap" \
      ALADUO_CLAUDE_AUTH_SOURCE="${ALADUO_CLAUDE_AUTH_SOURCE:-anthropic_api_key}" ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-sk-ant-scenario-no-model}" \
      ALADUO_LOG_LEVEL="${ALADUO_LOG_LEVEL:-info}" ALADUO_WORK_DIR="$ISO/work" \
      DUO_TRACE_FILE="$TRACE" "$@" node daemon.traced.js >> "$SDIR/boot.log" 2>&1 ) &
  DPID=$!
  echo "$DPID" > "$SDIR/daemon.pid"
  for _ in $(seq 1 100); do
    [ -S "$SOCK" ] && curl -s -m 2 -o /dev/null "127.0.0.1:$ALADUO_PORT/healthz" && { echo "   daemon up (pid $DPID)"; return 0; }
    kill -0 "$DPID" 2>/dev/null || { echo "   daemon exited early; boot.log:"; tail -20 "$SDIR/boot.log"; return 1; }
    sleep 0.2
  done
  echo "   daemon did not come up in 20 s"; tail -20 "$SDIR/boot.log"; return 1
}

daemon_stop() {
  [ -n "${DPID:-}" ] || return 0
  kill -TERM "$DPID" 2>/dev/null || true
  for _ in $(seq 1 50); do kill -0 "$DPID" 2>/dev/null || break; sleep 0.2; done
  kill -KILL "$DPID" 2>/dev/null || true
  DPID=""
}

# mark "text": a phase boundary in the trace (trace_report.mjs splits on it)
mark() { sleep 0.3; printf '{"ev":"mark","name":%s,"seq":0,"t":0}\n' "$(node -p 'JSON.stringify(process.argv[1])' "$1")" >> "$TRACE"; echo "-- $1"; }

# rpc_tcp <method> <params-json>  /  rpc_sock <method> <params-json>: the
# read-only TCP listener and the full unix-socket control plane. Prints the
# response and appends it to rpc.jsonl in the scenario dir.
_rpc() {
  local via="$1" method="$2" params="${3:-{\}}" id="$RANDOM" body
  body="{\"jsonrpc\":\"2.0\",\"id\":$id,\"method\":\"$method\",\"params\":$params}"
  local resp
  if [ "$via" = tcp ]; then
    resp="$(curl -s -m 20 -H 'Content-Type: application/json' -XPOST "127.0.0.1:$ALADUO_PORT/rpc" -d "$body")"
  else
    resp="$(curl -s -m 20 -H 'Content-Type: application/json' --unix-socket "$SOCK" http://localhost/rpc -XPOST -d "$body")"
  fi
  printf '{"via":"%s","method":"%s","params":%s,"response":%s}\n' "$via" "$method" "$params" "${resp:-null}" >> "$SDIR/rpc.jsonl"
  echo "$resp"
}
rpc_tcp() { _rpc tcp "$@"; }
rpc_sock() { _rpc sock "$@"; }

# save <path> [name]: copy a file from the isolated HOME into the scenario dir
save() { local f="$1" n="${2:-$(basename "$1")}"; [ -e "$f" ] && cp -r "$f" "$SDIR/$n" || echo "   (no $f)"; }

report() {
  node "$TOOLS/trace_report.mjs" "$TRACE" --depth "${DEPTH:-5}" --out "$SDIR/report.md" --json "$SDIR/report.json"
  echo "   report: $SDIR/report.md ($(grep -c '"ev":"enter"' "$TRACE") calls)"
}
