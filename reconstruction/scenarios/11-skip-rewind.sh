#!/usr/bin/env bash
# needs-model
# Skip on the Claude engine (INTERNALS §4.5; settles §14.1 item 1): after the
# PreToolUse hook for mcp__aladuo__Skip returns continue:false, does the Agent
# SDK still run the tool body (runSkipTool), so that state.json gets
# pending_skip_rewind and the next user turn carries a <skip-rewind> block?
# THIS SCENARIO CALLS A REAL MODEL (Claude engine through the Agent SDK, with the
# machine's Claude Code login): two model turns.
#   turn 1  a user message asking the model to call the Skip tool once and say
#           nothing: trace the two PreToolUse hook closures, the tool body, the
#           PostToolUse closure, markTurnSkippedFromSkipRecord; snapshot state.json
#   turn 2  "reply with the single word ok": is the <skip-rewind> block built
#           (renderSkipRewindBlock) and does the model receive it (transcript)?
# Credentials as in 10-restart-hint: the OAuth access token without the refresh
# token, copied into the isolated HOME and removed with it at exit.
source "$(dirname "$0")/lib.sh"
scenario_init 11-skip-rewind
VAR="$ISO/.aladuo/var"
KIND="terse"; CH="terse-11"; SK="terse:room-11"; WORK="$ISO/work"; mkdir -p "$WORK"
CLAUDE_ENV=(ALADUO_CLAUDE_AUTH_SOURCE=claude_code_local)

mkdir -p "$ISO/.claude"; chmod 700 "$ISO/.claude"
node -e '
  const c = require(process.argv[1]).claudeAiOauth;
  if (!c || !c.accessToken) { console.error("no claudeAiOauth"); process.exit(1); }
  if (c.expiresAt < Date.now() + 15 * 60e3) { console.error("access token expires within 15 min"); process.exit(1); }
  const o = { ...c }; delete o.refreshToken; delete o.refreshTokenExpiresAt;
  require("fs").writeFileSync(process.argv[2], JSON.stringify({ claudeAiOauth: o }), { mode: 0o600 });
' "$HOME/.claude/.credentials.json" "$ISO/.claude/.credentials.json" || { echo "   no usable Claude login"; exit 1; }

mkdir -p "$ISO/aladuo/config"
cat > "$ISO/aladuo/config/$KIND.md" <<'EOF'
---
runtime: claude
---
This channel is an automated test harness. Answer every message with as few words as possible.
Do not use any tool unless the message explicitly asks you to call that tool.
EOF

trace_len() { wc -l < "$TRACE"; }
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
pull_final() { rpc_sock channel.pull "{\"session_key\":\"$SK\",\"consumer_id\":\"scenario-11\",\"return_mask\":[\"final\"]}"; }
state() { cat "$VAR"/sessions/*/state.json 2>/dev/null; }

mark "boot (claude auth source)"
daemon_start "${CLAUDE_ENV[@]}" || exit 1
sleep 1
mark "spawn claude channel"
rpc_sock channel.spawn "{\"channel_kind\":\"$KIND\",\"channel_id\":\"$CH\",\"runtime\":\"claude\",\"cwd_abs\":\"$WORK\",\"session_key\":\"$SK\"}"; echo

mark "turn 1: ask the model to call Skip"
L0=$(trace_len)
MSG='This is a test of the Skip tool. Call the tool mcp__aladuo__Skip exactly once, as your first and only action, with reason \"scenario 11 skip test\". Do not write any text.'
rpc_sock channel.ingress "{\"session_key\":\"$SK\",\"text\":\"$MSG\",\"source_kind\":\"$KIND\",\"channel_id\":\"$CH\"}"; echo
wait_turn "$L0" || { tail -40 "$SDIR/boot.log"; daemon_stop; report; exit 1; }
sleep 1
state > "$SDIR/state-after-turn1.json"
jq -c '{pending_skip_rewind}' "$SDIR/state-after-turn1.json"
pull_final | jq . > "$SDIR/pull-turn1.json"
echo "   final records after turn 1: $(jq '.result.records | length' "$SDIR/pull-turn1.json")"

mark "turn 2: channel.ingress 'reply with the single word ok'"
L0=$(trace_len)
rpc_sock channel.ingress "{\"session_key\":\"$SK\",\"text\":\"reply with the single word ok\",\"source_kind\":\"$KIND\",\"channel_id\":\"$CH\"}"; echo
wait_turn "$L0"
sleep 1
state > "$SDIR/state-after-turn2.json"
jq -c '{pending_skip_rewind}' "$SDIR/state-after-turn2.json"
pull_final | jq . > "$SDIR/pull-turn2.json"
echo "   final records after turn 2: $(jq '.result.records | length' "$SDIR/pull-turn2.json")"

mark "shutdown"
daemon_stop
cat "$VAR"/events/*.jsonl > "$SDIR/events.jsonl" 2>/dev/null
save "$VAR/sessions" sessions
save "$VAR/outbox" outbox
save "$ISO/.claude/projects" claude-transcripts
report
