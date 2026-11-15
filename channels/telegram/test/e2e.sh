#!/usr/bin/env bash
# End-to-end test: an isolated duoduo daemon + this adapter + a fake Telegram.
#
#   PKG=<scratch install>/node_modules/@openduo/duoduo/dist/release [WORK=<empty dir>] bash test/e2e.sh
#
# PKG must be a scratch install, never the global one the live daemon runs
# from. The daemon runs with its own HOME (WORK), port and socket, and the
# kind config sets `runtime: void`, so no model is called: every message comes
# back as an outbox record of its own text, and gateway commands (/status) are
# answered by the daemon itself. Both go through the same channel.pull path a
# model's reply takes.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
: "${PKG:?set PKG to the dist/release directory of a scratch install}"
WORK="${WORK:-$(mktemp -d)}"
mkdir -p "$WORK" && chmod 700 "$WORK"
RUNDIR="${XDG_RUNTIME_DIR:-}"
if [[ -z "$RUNDIR" || ! -d "$RUNDIR" ]]; then RUNDIR="$(mktemp -d /tmp/ddtg.XXXX)"; chmod 700 "$RUNDIR"; fi
SOCK="$RUNDIR/dd-tg-e2e-$$.sock"        # short: unix sockets allow ~104 bytes
DPORT="${DPORT:-20351}"
TPORT="${TPORT:-18081}"
CLI=(env -u https_proxy -u http_proxy -u no_proxy HOME="$WORK" ALADUO_DAEMON_SOCKET="$SOCK" node "$PKG/cli.js")
PLUGIN_LOG="$WORK/.aladuo/plugins/channels/telegram/run/plugin.log"
DAEMON_PID="" FAKE_PID=""

cleanup() {
  "${CLI[@]}" channel telegram stop </dev/null >/dev/null 2>&1 || true
  [[ -n "$DAEMON_PID" ]] && kill "$DAEMON_PID" 2>/dev/null || true
  [[ -n "$FAKE_PID" ]] && kill "$FAKE_PID" 2>/dev/null || true
  rm -f "$SOCK"
}
trap cleanup EXIT

start_daemon() {
  (cd "$PKG" && HOME="$WORK" ALADUO_PORT="$DPORT" ALADUO_DAEMON_SOCKET="$SOCK" \
    ALADUO_WORK_DIR="$WORK/work" ALADUO_LOG_LEVEL=info \
    ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local exec node daemon.js >>"$WORK/daemon.log" 2>&1) &
  DAEMON_PID=$!
  for _ in $(seq 1 60); do curl -sf "127.0.0.1:$DPORT/healthz" >/dev/null && return; sleep 0.5; done
  echo "daemon did not come up; see $WORK/daemon.log" >&2; exit 1
}

inject() { curl -sf -XPOST "127.0.0.1:$TPORT/_inject" -H 'Content-Type: application/json' -d "$1" >/dev/null; }
sent_json() { curl -sf "127.0.0.1:$TPORT/_sent"; }
sent_count() { sent_json | node -e 'console.log(JSON.parse(require("fs").readFileSync(0)).length)'; }
offset() { node -p "require('$WORK/tgstate/state.json').offset"; }

PASS=0
check() { # check <description> <command...>
  local desc="$1"; shift
  if "$@"; then echo "ok   $desc"; PASS=$((PASS + 1)); else echo "FAIL $desc" >&2; echo "--- plugin.log" >&2; tail -20 "$PLUGIN_LOG" >&2; exit 1; fi
}
# wait_for <seconds> <command...>: retry until the command succeeds
wait_for() { local n=$(( $1 * 4 )); shift; for _ in $(seq 1 "$n"); do "$@" && return 0; sleep 0.25; done; return 1; }
count_is() { [[ "$(sent_count)" == "$1" ]]; }
nth_text_is() { # nth_text_is <index from 0, negative from end> <text>
  sent_json | node -e '
    const a = JSON.parse(require("fs").readFileSync(0)); const i = Number(process.argv[1]);
    const m = a.at(i); process.exit(m && m.text === process.argv[2] ? 0 : 1);' -- "$1" "$2"
}
nth_text_has() {
  sent_json | node -e '
    const a = JSON.parse(require("fs").readFileSync(0)); const m = a.at(Number(process.argv[1]));
    process.exit(m && (m.text ?? "").includes(process.argv[2]) ? 0 : 1);' -- "$1" "$2"
}
nth_kind_is() {
  sent_json | node -e '
    const a = JSON.parse(require("fs").readFileSync(0)); const m = a.at(Number(process.argv[1]));
    process.exit(m && m.kind === process.argv[2] ? 0 : 1);' -- "$1" "$2"
}
log_has() { grep -q -- "$1" "$PLUGIN_LOG"; }

echo "work dir: $WORK"
(cd "$HERE" && exec node test/fake-telegram.mjs "$TPORT" >"$WORK/fake.log" 2>&1) &
FAKE_PID=$!
start_daemon

# Kind config: never run a model in this test.
mkdir -p "$WORK/aladuo/config"
printf -- '---\nruntime: void\n---\n\nTest kind prompt.\n' >"$WORK/aladuo/config/telegram.md"

TGZ="$(cd "$HERE" && npm pack --silent --pack-destination "$WORK")"
mkdir -p "$WORK/.config/duoduo"
cat >"$WORK/.config/duoduo/.env" <<EOF
TELEGRAM_BOT_TOKEN=123:TEST
TELEGRAM_ALLOW_FROM=777
TELEGRAM_API_BASE=http://telegram.invalid
TELEGRAM_PROXY=http://127.0.0.1:$TPORT
TELEGRAM_STATE_DIR=$WORK/tgstate
TELEGRAM_OUTBOX_POLL_MS=300
# The API host does not resolve, so every Telegram request works only if it
# goes through TELEGRAM_PROXY; the fake server also acts as that proxy.
EOF
chmod 600 "$WORK/.config/duoduo/.env"

check "channel install --from-path" bash -c "${CLI[*]} channel install --from-path '$WORK/$TGZ' </dev/null | grep -q 'installed telegram'"
check "kind config kept (install never overwrites)" grep -q 'runtime: void' "$WORK/aladuo/config/telegram.md"
check "channel start" bash -c "${CLI[*]} channel telegram start </dev/null | grep -q 'started telegram'"
check "adapter reaches Telegram and daemon" wait_for 10 log_has "daemon reachable"
check "Telegram requests go through TELEGRAM_PROXY" log_has "Telegram via proxy http://127.0.0.1:"

OWNER='"from":{"id":777,"first_name":"Owner","username":"owner"},"chat":{"id":777,"type":"private"}'

inject '{"message":{"message_id":1,'"$OWNER"',"text":"/start"}}'
check "/start answered locally" wait_for 5 nth_text_has -1 "已连接 duoduo"

inject '{"message":{"message_id":2,"from":{"id":999},"chat":{"id":999,"type":"private"},"text":"hi"}}'
check "user outside TELEGRAM_ALLOW_FROM ignored and logged" wait_for 5 log_has "ignored message from user 999"
inject '{"message":{"message_id":3,"from":{"id":777},"chat":{"id":-100123,"type":"supergroup"},"text":"group"}}'
check "group chat ignored" wait_for 5 log_has "ignored message in supergroup chat"
check "nothing sent for ignored messages" count_is 1

inject '{"message":{"message_id":4,'"$OWNER"',"text":"hello duoduo"}}'
check "message reaches the daemon and its record comes back" wait_for 10 nth_text_is -1 "hello duoduo"

inject '{"message":{"message_id":5,'"$OWNER"',"text":"/status@duoduo_test_bot"}}'
check "gateway command (bot mention stripped) answered" wait_for 10 nth_text_has -1 "ALADUO Status"

inject '{"message":{"message_id":6,'"$OWNER"',"caption":"看这张图","photo":[{"file_id":"s"},{"file_id":"b"}]}}'
check "photo uploaded into the daemon's inbox" wait_for 10 bash -c "ls '$WORK/work/inbox'/*/ 2>/dev/null | grep -q '\.jpg'"
check "record with the attachment sent as a document" wait_for 10 nth_kind_is -1 document

BEFORE="$(sent_count)"
inject '{"message":{"message_id":4,'"$OWNER"',"text":"hello duoduo"}}'
sleep 2
check "redelivered Telegram message deduplicated by idempotency key" count_is "$BEFORE"

LONG="$(node -e 'let s="";for(let i=0;i<300;i++)s+=`line ${i}: text for the split test, lorem ipsum.\\n`;process.stdout.write(s)')"
inject '{"message":{"message_id":7,'"$OWNER"',"text":"'"$LONG"'"}}'
split_ok() { # the messages after index $1 are >= 2 parts, each <= 4096 chars, and rejoin to $2
  sent_json | node -e '
    const a = JSON.parse(require("fs").readFileSync(0)).slice(Number(process.argv[1]));
    const ok = a.length >= 2 && a.every((m) => m.text.length <= 4096)
      && a.map((m) => m.text).join("\n") === process.argv[2].trim();
    process.exit(ok ? 0 : 1);' -- "$1" "$2"
}
check "long reply split into parts of at most 4096 chars that rejoin to the original" \
  wait_for 10 split_ok "$BEFORE" "$(printf '%b' "$LONG")"

BEFORE="$(sent_count)"
"${CLI[@]}" channel telegram stop </dev/null >/dev/null
"${CLI[@]}" channel telegram start </dev/null >/dev/null
sleep 3
check "adapter restart resends nothing (offset and cursor persisted)" count_is "$BEFORE"

kill "$DAEMON_PID"; wait "$DAEMON_PID" 2>/dev/null || true
OFF="$(offset)"
inject '{"message":{"message_id":8,'"$OWNER"',"text":"sent while the daemon is down"}}'
check "daemon down: adapter retries" wait_for 10 log_has "daemon unreachable"
check "daemon down: Telegram offset held" test "$(offset)" == "$OFF"
start_daemon
check "daemon back: held message delivered" wait_for 30 nth_text_is -1 "sent while the daemon is down"

echo "all $PASS checks passed"
