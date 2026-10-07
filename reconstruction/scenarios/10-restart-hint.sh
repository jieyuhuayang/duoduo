#!/usr/bin/env bash
# needs-model
# The restart hint block (INTERNALS §6.4, claim R5 left open by 08-restart-reason;
# §2.3 for its placement among the per-turn transient blocks).
# THIS SCENARIO CALLS A REAL MODEL (Claude engine through the Agent SDK, with the
# machine's Claude Code login): three model turns, each a one-word reply.
#   boot 1  channel session on runtime claude; one message "reply ok" -> turn 1
#           (decideRestartHintInjection records last_seen_daemon_started_at)
#   restart reason file written by hand, wake_targets = [that session]
#   boot 2  the wake notify reaches the session -> turn 2, which should carry the
#           daemon-restart-hint block (stage cross-restart); then a second
#           message "reply ok" -> turn 3, which should not carry it again.
# What the model received is read from the Claude Code transcript the SDK writes
# under the isolated HOME ($ISO/.claude/projects/...).
# Credentials: claude_code_local reads <HOME>/.claude/.credentials.json, and HOME
# is the isolated one, so the script copies the OAuth access token there WITHOUT
# the refresh token (the isolated session can then never rotate the real login);
# the copy is removed with $ISO at exit. If the access token has expired the
# first turn fails and the script stops.
source "$(dirname "$0")/lib.sh"
scenario_init 10-restart-hint
VAR="$ISO/.aladuo/var"; RFILE="$VAR/daemon-restart-reason.json"
KIND="terse"; CH="terse-10"; SK="terse:room-10"; WORK="$ISO/work"; mkdir -p "$WORK"
CLAUDE_ENV=(ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local)

# --- isolated Claude Code login (access token only) ---
mkdir -p "$ISO/.claude"; chmod 700 "$ISO/.claude"
node -e '
  const c = require(process.argv[1]).claudeAiOauth;
  if (!c || !c.accessToken) { console.error("no claudeAiOauth"); process.exit(1); }
  if (c.expiresAt < Date.now() + 15 * 60e3) { console.error("access token expires within 15 min"); process.exit(1); }
  const o = { ...c }; delete o.refreshToken; delete o.refreshTokenExpiresAt;
  require("fs").writeFileSync(process.argv[2], JSON.stringify({ claudeAiOauth: o }), { mode: 0o600 });
' "$HOME/.claude/.credentials.json" "$ISO/.claude/.credentials.json" || { echo "   no usable Claude login"; exit 1; }

# --- a channel kind with minimal instructions ---
mkdir -p "$ISO/aladuo/config"
cat > "$ISO/aladuo/config/$KIND.md" <<'EOF'
---
runtime: claude
---
This channel is an automated test harness. Answer every message with as few words as possible.
Do not use any tool unless the message explicitly asks you to call that tool.
EOF

# trace helpers: wait for one model turn after the current end of the trace
trace_len() { wc -l < "$TRACE"; }
# wait_turn <from-line>: a buildTransientUserBlocks enter after line N, then a
# drainSessionMailbox exit after it (one drained turn); prints the seconds waited
wait_turn() {
  local from="$1" t0=$SECONDS
  for _ in $(seq 1 240); do
    if tail -n +"$((from + 1))" "$TRACE" | node -e '
      const L = require("fs").readFileSync(0, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return {} } });
      const b = L.findIndex(e => e.ev === "enter" && e.name === "buildTransientUserBlocks");
      process.exit(b >= 0 && L.slice(b).some(e => e.ev === "exit" && e.name === "drainSessionMailbox") ? 0 : 1);'; then
      echo "   turn drained after $((SECONDS - t0)) s"; return 0
    fi
    sleep 1
  done
  echo "   TIMEOUT waiting for a drained turn"; return 1
}
pull_final() { rpc_sock channel.pull "{\"session_key\":\"$SK\",\"consumer_id\":\"scenario-10\",\"return_mask\":[\"final\"]}"; }
state() { cat "$VAR"/sessions/*/state.json 2>/dev/null; }

mark "boot 1 (claude auth source)"
daemon_start "${CLAUDE_ENV[@]}" || exit 1
sleep 1
mark "spawn claude channel"
rpc_sock channel.spawn "{\"channel_kind\":\"$KIND\",\"channel_id\":\"$CH\",\"runtime\":\"claude\",\"cwd_abs\":\"$WORK\",\"session_key\":\"$SK\"}"; echo

mark "turn 1: channel.ingress 'reply with the single word ok'"
L0=$(trace_len)
rpc_sock channel.ingress "{\"session_key\":\"$SK\",\"text\":\"reply with the single word ok\",\"source_kind\":\"$KIND\",\"channel_id\":\"$CH\"}"; echo
wait_turn "$L0"
sleep 1
P1="$(pull_final)"; echo "$P1" | jq . > "$SDIR/pull-turn1.json"
N1="$(echo "$P1" | jq '.result.records | length')"; echo "   final records after turn 1: $N1"
state > "$SDIR/state-after-turn1.json"
if [ "${N1:-0}" -lt 1 ]; then
  echo "!! first model turn produced no reply; boot.log tail:"; tail -40 "$SDIR/boot.log"
  daemon_stop; save "$ISO/.aladuo/var/sessions" sessions; report; exit 1
fi
mark "shutdown 1"
daemon_stop

NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
printf '%s' "{\"reason\":\"scenario 10: kernel prompt changed\",\"requested_at\":\"$NOW\",\"requested_by_agent\":false,\"wake_targets\":[\"$SK\"]}" > "$RFILE"
cp "$RFILE" "$SDIR/reason.json"

mark "boot 2 (reason file with wake target = the claude session)"
L0=$(trace_len)
daemon_start "${CLAUDE_ENV[@]}" || exit 1
mark "turn 2: wait for the wake-driven turn (no new inbound message)"
wait_turn "$L0"
sleep 1
state > "$SDIR/state-after-turn2.json"
pull_final | jq . > "$SDIR/pull-turn2.json"

mark "turn 3: second channel.ingress 'reply with the single word ok'"
L0=$(trace_len)
rpc_sock channel.ingress "{\"session_key\":\"$SK\",\"text\":\"reply with the single word ok\",\"source_kind\":\"$KIND\",\"channel_id\":\"$CH\"}"; echo
wait_turn "$L0"
sleep 1
state > "$SDIR/state-after-turn3.json"
pull_final | jq . > "$SDIR/pull-turn3.json"

mark "shutdown 2"
daemon_stop
cat "$VAR"/events/*.jsonl > "$SDIR/events.jsonl" 2>/dev/null
save "$VAR/sessions" sessions
save "$ISO/.claude/projects" claude-transcripts
report
