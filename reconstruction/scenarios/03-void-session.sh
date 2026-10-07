#!/usr/bin/env bash
# A channel whose runtime is `void`: its sessions never run a model. Tests
# INTERNALS §1.2 (fourth point), §3.1, §4.3, §5.1, §6.2, §8.5, §9.1 and §14.2
# item 7: an inbound message to a void session is appended to the WAL and the
# by_id index, writes NO mailbox pointer, is copied to the outbox instead, never
# wakes or drains the session; session commands, session.wake and
# session.compact are refused; a session.notify becomes an outbox record that
# carries notify_in_reply_to in payload.data; channel.pull hands the records to
# an adapter.
#
# Two void channels, one per configuration layer:
#   A  void-inst-1  (kind voidinst): instance descriptor written by channel.spawn
#                   with runtime: void
#   B  void-kind-1  (kind voidkind): the kind descriptor kernel/config/voidkind.md
#                   says runtime: void; the instance descriptor (hand-written
#                   before boot) has no runtime key
source "$(dirname "$0")/lib.sh"
scenario_init 03-void-session

SK_A="voidinst:room-1"; CH_A="void-inst-1"
SK_B="voidkind:room-2"; CH_B="void-kind-1"
WORK="$ISO/work"; mkdir -p "$WORK"

# Kind layer for B. copyBootstrapIntoKernel copies the bootstrap tree into a
# non-empty kernel "missing only", so this file survives the first boot.
mkdir -p "$ISO/aladuo/config"
cat > "$ISO/aladuo/config/voidkind.md" <<'EOF'
---
runtime: void
---
Kind prompt of a channel kind whose sessions never run a model.
EOF
# Instance layer for B: a minimal descriptor (readChannelDescriptor requires
# schema_version, revision, channel_id, channel_kind) with no runtime key.
mkdir -p "$ISO/.aladuo/var/channels/$CH_B"
cat > "$ISO/.aladuo/var/channels/$CH_B/descriptor.md" <<EOF
---
schema_version: 1
revision: 1
channel_id: $CH_B
channel_kind: voidkind
new_session_workspace: $WORK
---
EOF

mark "boot"
daemon_start ALADUO_LOG_LEVEL=debug || exit 1
sleep 1
save "$ISO/aladuo/config/voidkind.md" kind-voidkind.md

mark "A: channel.spawn runtime=void (instance layer)"
rpc_sock channel.spawn "{\"channel_kind\":\"voidinst\",\"channel_id\":\"$CH_A\",\"runtime\":\"void\",\"cwd_abs\":\"$WORK\",\"session_key\":\"$SK_A\"}"; echo
save "$ISO/.aladuo/var/channels/$CH_A/descriptor.md" descriptor-A.md

mark "A: channel.describe"
rpc_sock channel.describe "{\"channel_kind\":\"voidinst\",\"channel_id\":\"$CH_A\",\"session_key\":\"$SK_A\"}" | head -c 1200; echo
mark "B: channel.describe (kind layer)"
rpc_sock channel.describe "{\"channel_kind\":\"voidkind\",\"channel_id\":\"$CH_B\",\"session_key\":\"$SK_B\"}" | head -c 1200; echo

mark "A: channel.ingress plain message"
rpc_sock channel.ingress "{\"session_key\":\"$SK_A\",\"text\":\"hello void A\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\",\"display_name\":\"Room A\"}"; echo
sleep 1
mark "A: snapshot after plain message"
find "$ISO/.aladuo/var/sessions" -type f 2>/dev/null | sed "s|$ISO|\$ISO|" | sort > "$SDIR/sessions-files-after-ingress.txt"
find "$ISO/.aladuo/var/outbox" -type f 2>/dev/null | sed "s|$ISO|\$ISO|" | sort > "$SDIR/outbox-files-after-ingress.txt"

mark "B: channel.ingress plain message (kind-layer void)"
rpc_sock channel.ingress "{\"session_key\":\"$SK_B\",\"text\":\"hello void B\",\"source_kind\":\"voidkind\",\"channel_id\":\"$CH_B\"}"; echo

mark "A: channel.ingress /compact (session command)"
rpc_sock channel.ingress "{\"session_key\":\"$SK_A\",\"text\":\"/compact\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\"}"; echo
mark "A: channel.ingress /loop do something (injection prompt)"
rpc_sock channel.ingress "{\"session_key\":\"$SK_A\",\"text\":\"/loop check the build\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\"}"; echo
mark "A: channel.ingress /model (gateway command)"
rpc_sock channel.ingress "{\"session_key\":\"$SK_A\",\"text\":\"/model\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\"}"; echo
mark "A: channel.ingress /status (gateway command)"
rpc_sock channel.ingress "{\"session_key\":\"$SK_A\",\"text\":\"/status\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\"}" | head -c 600; echo
mark "A: channel.command /compact"
rpc_sock channel.command "{\"session_key\":\"$SK_A\",\"command\":\"/compact\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\"}"; echo

mark "A: session.notify with in_reply_to"
rpc_sock session.notify "{\"target\":\"$SK_A\",\"message\":\"note for void A\",\"source\":\"scenario-03\",\"in_reply_to\":\"mail-42\"}"; echo
mark "A: session.wake"
rpc_sock session.wake "{\"session_key\":\"$SK_A\",\"when\":\"@in 10m\",\"context\":\"wake up\"}"; echo
mark "A: session.compact"
rpc_sock session.compact "{\"target\":\"$SK_A\"}"; echo
mark "A: session.model / session.effort (read)"
rpc_sock session.model "{\"session_key\":\"$SK_A\"}"; echo
rpc_sock session.effort "{\"session_key\":\"$SK_A\"}"; echo

sleep 1
mark "A: channel.pull (HTTP, final)"
PULL="$(rpc_sock channel.pull "{\"session_key\":\"$SK_A\",\"consumer_id\":\"scenario-03\",\"return_mask\":[\"final\"]}")"
echo "$PULL" | jq . > "$SDIR/pull-A.json"; echo "$PULL" | jq -c '.result | {n: (.records|length), next_cursor, idle}'
CUR="$(echo "$PULL" | jq -r '.result.next_cursor // empty')"
mark "A: channel.ack + pull again"
[ -n "$CUR" ] && { rpc_sock channel.ack "{\"session_key\":\"$SK_A\",\"consumer_id\":\"scenario-03\",\"cursor\":\"$CUR\"}"; echo; }
rpc_sock channel.pull "{\"session_key\":\"$SK_A\",\"consumer_id\":\"scenario-03\",\"return_mask\":[\"final\"]}" | jq -c '.result | {n: (.records|length), idle}'
mark "B: channel.pull"
rpc_sock channel.pull "{\"session_key\":\"$SK_B\",\"consumer_id\":\"scenario-03\",\"return_mask\":[\"final\"]}" | jq . > "$SDIR/pull-B.json"

mark "session.list"
rpc_sock session.list '{}' | jq . > "$SDIR/session-list.json"

sleep 2
mark "shutdown"
daemon_stop
find "$ISO/.aladuo/var/sessions" -type f 2>/dev/null | sed "s|$ISO|\$ISO|" | sort > "$SDIR/sessions-files-final.txt"
find "$ISO/.aladuo/var/outbox" -type f 2>/dev/null | sed "s|$ISO|\$ISO|" | sort > "$SDIR/outbox-files-final.txt"
grep -rn "@evt(" "$ISO/.aladuo/var/sessions" 2>/dev/null | sed "s|$ISO|\$ISO|" > "$SDIR/mailbox-pointers.txt" || true
save "$ISO/.aladuo/var/events" events
save "$ISO/.aladuo/var/outbox" outbox
save "$ISO/.aladuo/var/sessions" sessions
save "$ISO/.aladuo/var/registry" registry
report
