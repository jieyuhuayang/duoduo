#!/usr/bin/env bash
# The main session (INTERNALS §8.6, §4.3; settles §14.2 item 8 for the daemon
# side). No model: the three channel sessions are `void`, so every notice the
# daemon sends them becomes an outbox record that says who received what.
#   1  channel.spawn with display_name "main" is refused, nothing written
#   2  session.set_alias A main (owner terminal, no caller fields): A becomes
#      main, main_since is stamped, A gets the "you are now the main session"
#      notice (source main-role); session.list marks A main: "held"
#   3  session.set_alias B main without move: refused main_held
#   4  the same from inside a session: caller_in_session without caller_session
#      -> no_caller; caller_session = B (not main) -> not_main
#   5  caller_session = A (the main) with move: B becomes main, A is cleared;
#      A gets the "no longer main" notice, B the "now main" notice
#   6  session.notify target "main" reaches B; session.set_alias C to "main"
#      through any other name path is impossible, so the alias stays unique
#   7  two sessions aliased main (meta.md edited by hand while the daemon is
#      down), restart: system.status carries main_session (ambiguous),
#      session.list marks both candidate, the boot reconciliation notifies both,
#      and session.notify target "main" is refused
source "$(dirname "$0")/lib.sh"
scenario_init 12-main-session
VAR="$ISO/.aladuo/var"; WORK="$ISO/work"
KIND="voidmain"
SK_A="voidmain:room-a"; SK_B="voidmain:room-b"; SK_C="voidmain:room-c"

outbox_texts() {  # every outbox record's session and text, oldest first
  find "$VAR/outbox" -type f -name 'obx_*.json' 2>/dev/null | xargs -r ls -tr | while read -r f; do
    node -e '
      const fs = require("fs");
      let r; try { r = JSON.parse(fs.readFileSync(process.argv[1], "utf8")) } catch { process.exit(0) }
      console.log(JSON.stringify({ session: r.session_key, text: String(r.payload?.text ?? "").slice(0, 110) }));' "$f"
  done
}
state_of() { local d; d="$(node -e 'console.log(require("crypto").createHash("sha256").update(process.argv[1]).digest("hex"))' "$1")"; cat "$VAR/sessions/$d/state.json" 2>/dev/null; }
meta_of()  { local d; d="$(node -e 'console.log(require("crypto").createHash("sha256").update(process.argv[1]).digest("hex"))' "$1")"; echo "$VAR/sessions/$d/meta.md"; }
list_main() { rpc_sock session.list '{}' | jq -c '[.result[]? // .result.sessions[]? | select(.session_key|startswith("voidmain:")) | {session_key, display_name, main, main_since}]'; }

mark "boot"
daemon_start || exit 1
sleep 1

mark "1 channel.spawn A, B, C (void); a spawn that asks for display_name main"
for X in a b c; do
  rpc_sock channel.spawn "{\"channel_kind\":\"$KIND\",\"channel_id\":\"vm-$X\",\"runtime\":\"void\",\"cwd_abs\":\"$WORK\",\"session_key\":\"voidmain:room-$X\"}" | jq -c '.result.ok // .error'
done
rpc_sock channel.spawn "{\"channel_kind\":\"$KIND\",\"channel_id\":\"vm-d\",\"runtime\":\"void\",\"cwd_abs\":\"$WORK\",\"session_key\":\"voidmain:room-d\",\"display_name\":\"main\"}" | tee "$SDIR/spawn-main.json" | jq -c '.result // .error'
echo "   room-d session dir exists: $( [ -f "$(meta_of voidmain:room-d)" ] && echo yes || echo no)"

mark "2 set_alias A main from the owner's terminal"
rpc_sock session.set_alias "{\"session_key\":\"$SK_A\",\"display_name\":\"main\"}" | tee "$SDIR/alias-a.json" | jq -c '.result // .error'
sleep 1
echo "   A main_since: $(state_of "$SK_A" | jq -r '.main_since // "none"')"
list_main | tee "$SDIR/list-after-2.json"
outbox_texts > "$SDIR/outbox-after-2.jsonl"; cat "$SDIR/outbox-after-2.jsonl"

mark "3 set_alias B main without move"
rpc_sock session.set_alias "{\"session_key\":\"$SK_B\",\"display_name\":\"main\"}" | tee "$SDIR/alias-b-nomove.json" | jq -c '.result // .error'

mark "4 from inside a session: unidentified caller, then a caller that is not main"
rpc_sock session.set_alias "{\"session_key\":\"$SK_B\",\"display_name\":\"main\",\"move\":true,\"caller_in_session\":true}" | tee "$SDIR/alias-b-nocaller.json" | jq -c '.result // .error'
rpc_sock session.set_alias "{\"session_key\":\"$SK_B\",\"display_name\":\"main\",\"move\":true,\"caller_in_session\":true,\"caller_session\":\"$SK_B\"}" | tee "$SDIR/alias-b-notmain.json" | jq -c '.result // .error'

mark "5 the main itself moves main to B"
rpc_sock session.set_alias "{\"session_key\":\"$SK_B\",\"display_name\":\"main\",\"move\":true,\"caller_in_session\":true,\"caller_session\":\"$SK_A\"}" | tee "$SDIR/alias-b-move.json" | jq -c '.result // .error'
sleep 1
echo "   B main_since: $(state_of "$SK_B" | jq -r '.main_since // "none"')"
list_main | tee "$SDIR/list-after-5.json"
outbox_texts > "$SDIR/outbox-after-5.jsonl"; tail -n +"$(( $(wc -l < "$SDIR/outbox-after-2.jsonl") + 1 ))" "$SDIR/outbox-after-5.jsonl"

mark "6 session.notify target main"
rpc_sock session.notify "{\"target\":\"main\",\"message\":\"scenario 12: for whoever is main\",\"source\":\"scenario-12\"}" | tee "$SDIR/notify-main.json" | jq -c '.result // .error'
sleep 1
outbox_texts | grep "scenario 12: for whoever is main" || echo "   (not in any outbox)"

mark "7 two sessions aliased main (hand-edited meta.md), restart"
daemon_stop
M="$(meta_of "$SK_C")"
save "$M" meta-c-before.md
if grep -q '^display_name:' "$M"; then sed -i 's/^display_name:.*/display_name: main/' "$M"; else sed -i '0,/^---$/!{0,/^---$/s/^---$/display_name: main\n---/}' "$M"; fi
save "$M" meta-c-after.md
N0=$(outbox_texts | wc -l)
daemon_start || exit 1
sleep 2
rpc_tcp system.status '{}' | jq -c '.result.main_session // "no main_session field"' | tee "$SDIR/status-main-session.json"
list_main | tee "$SDIR/list-after-7.json"
outbox_texts > "$SDIR/outbox-after-7.jsonl"; tail -n +"$((N0 + 1))" "$SDIR/outbox-after-7.jsonl"
rpc_sock session.notify "{\"target\":\"main\",\"message\":\"scenario 12: ambiguous\",\"source\":\"scenario-12\"}" | tee "$SDIR/notify-main-ambiguous.json" | jq -c '.result // .error'
grep -h "main-role\|main session" "$SDIR/boot.log" | tail -6

mark "the role notices in the event log: source and force"
daemon_stop
save "$VAR/events" events
save "$VAR/outbox" outbox
cat "$SDIR"/events/*.jsonl 2>/dev/null | jq -c 'select((.payload|tostring)|test("main session")) | {type, session_key, source: .source.name, force: .payload.force, notify_source_kind: .payload.notify_source_kind}' | sort | uniq -c

report
