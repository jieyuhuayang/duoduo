#!/usr/bin/env bash
# The dedup registry (var/registry/dedup.jsonl). Tests INTERNALS §5.3 and §14.2
# item 2: what one line of the table holds, whether it grows per key or per
# attempt, what a duplicate's RPC response looks like for each of the three
# users of the table (gateway ingest, session.notify, spine.record), and
# whether the WAL gets one event or one per attempt. A void channel is used so
# no model runs (scenario 03 shows a void session never drains).
#
# Steps:
#   1  channel.ingress, same idempotency_key, 5 times (void session A)
#   2  the same key with different text (content is not part of the key)
#   3  the same key from another instance of the same channel kind (B)
#   4  channel.command with the same key (same source kind)
#   5  a gateway command (/status) sent twice with its own key: what a replay
#      returns when the original has an outbox record indexed by event id
#   5b the void refusal of /compact sent twice with its own key: the refusal
#      record has no in_reply_to_event_id, so is the replay empty?
#   6  session.notify with idempotency_key twice, then the key with another
#      message
#   7  spine.record with dedup_key twice, then another source with that
#      dedup_key, then a source/conversation/dedup_key whose key equals the
#      gateway key of step 1 (the table has one key space)
source "$(dirname "$0")/lib.sh"
scenario_init 05-dedup

SK_A="voidinst:room-1"; CH_A="void-inst-1"
SK_B="voidinst:room-2"; CH_B="void-inst-2"
WORK="$ISO/work"; mkdir -p "$WORK"
REG="$ISO/.aladuo/var/registry/dedup.jsonl"
WAL() { cat "$ISO"/.aladuo/var/events/*.jsonl 2>/dev/null; }
snap() { # snap <label>: dedup lines and WAL events so far
  printf '%s\tdedup_lines=%s\twal_events=%s\n' "$1" "$( [ -f "$REG" ] && wc -l < "$REG" || echo 0)" "$(WAL | wc -l)" | tee -a "$SDIR/counts.tsv"
}
ingress() { rpc_sock channel.ingress "{\"session_key\":\"$1\",\"text\":\"$2\",\"source_kind\":\"voidinst\",\"channel_id\":\"$3\",\"idempotency_key\":\"$4\"}"; echo; }

mark "boot"
daemon_start ALADUO_LOG_LEVEL=debug || exit 1
sleep 1
rpc_sock channel.spawn "{\"channel_kind\":\"voidinst\",\"channel_id\":\"$CH_A\",\"runtime\":\"void\",\"cwd_abs\":\"$WORK\",\"session_key\":\"$SK_A\"}"; echo
rpc_sock channel.spawn "{\"channel_kind\":\"voidinst\",\"channel_id\":\"$CH_B\",\"runtime\":\"void\",\"cwd_abs\":\"$WORK\",\"session_key\":\"$SK_B\"}"; echo
snap "after spawn"

for i in 1 2 3 4 5; do
  mark "1.$i channel.ingress key=msg-1 (attempt $i)"
  ingress "$SK_A" "hello once" "$CH_A" "msg-1"
  snap "1.$i ingress msg-1"
done

mark "2 channel.ingress key=msg-1, different text"
ingress "$SK_A" "a different text" "$CH_A" "msg-1"
snap "2 ingress msg-1 other text"

mark "3 channel.ingress key=msg-1 from instance B (same kind)"
ingress "$SK_B" "hello from B" "$CH_B" "msg-1"
snap "3 ingress msg-1 from B"

mark "4 channel.command key=msg-1"
rpc_sock channel.command "{\"session_key\":\"$SK_A\",\"command\":\"/status\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\",\"idempotency_key\":\"msg-1\"}"; echo
snap "4 command msg-1"

for i in 1 2; do
  mark "5.$i channel.ingress /status key=cmd-1 (attempt $i)"
  rpc_sock channel.ingress "{\"session_key\":\"$SK_A\",\"text\":\"/status\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\",\"idempotency_key\":\"cmd-1\"}" | head -c 400; echo
  snap "5.$i /status cmd-1"
done

for i in 1 2; do
  mark "5b.$i channel.ingress /compact key=cmp-1 on void session (attempt $i)"
  rpc_sock channel.ingress "{\"session_key\":\"$SK_A\",\"text\":\"/compact\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH_A\",\"idempotency_key\":\"cmp-1\"}"; echo
  snap "5b.$i /compact cmp-1"
done

for i in 1 2; do
  mark "6.$i session.notify idempotency_key=n-1 (attempt $i)"
  rpc_sock session.notify "{\"target\":\"$SK_A\",\"message\":\"notify once\",\"source\":\"scenario-05\",\"idempotency_key\":\"n-1\"}"; echo
  snap "6.$i notify n-1"
done
mark "6.3 session.notify idempotency_key=n-1, different message"
rpc_sock session.notify "{\"target\":\"$SK_A\",\"message\":\"another message\",\"source\":\"scenario-05\",\"idempotency_key\":\"n-1\"}"; echo
snap "6.3 notify n-1 other message"

for i in 1 2; do
  mark "7.$i spine.record source=ext-a dedup_key=r-1 (attempt $i)"
  rpc_sock spine.record '{"source":"ext-a","conversation":"conv-1","payload":{"note":"record once"},"dedup_key":"r-1"}'; echo
  snap "7.$i record r-1"
done
mark "7.3 spine.record source=ext-b same conversation and dedup_key"
rpc_sock spine.record '{"source":"ext-b","conversation":"conv-1","payload":{"note":"other source"},"dedup_key":"r-1"}'; echo
snap "7.3 record ext-b r-1"
mark "7.4 spine.record whose key equals a gateway key (voidinst:conv-x:k-9)"
ingress "$SK_A" "gateway first" "$CH_A" "conv-x:k-9"
rpc_sock spine.record '{"source":"voidinst","conversation":"conv-x","payload":{"note":"collides"},"dedup_key":"k-9"}'; echo
snap "7.4 cross-api key"
mark "7.5 spine.record without dedup_key, twice"
rpc_sock spine.record '{"source":"ext-a","conversation":"conv-1","payload":{"note":"no key"}}'; echo
rpc_sock spine.record '{"source":"ext-a","conversation":"conv-1","payload":{"note":"no key"}}'; echo
snap "7.5 record no key x2"

mark "shutdown"
daemon_stop
save "$REG" dedup.jsonl
save "$ISO/.aladuo/var/events" events
save "$ISO/.aladuo/var/outbox" outbox
report
