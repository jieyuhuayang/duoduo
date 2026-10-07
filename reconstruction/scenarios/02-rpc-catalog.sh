#!/usr/bin/env bash
# Every RPC method of INTERNALS Appendix B.2 (the 36 names createDaemon's
# dispatch compares S.method against), plus two names it does not know, called
# once with {} on the read-only TCP listener and once on the unix socket; then,
# on the socket, once more with minimal valid params where that needs no model.
# Settles §14.2 item 4 (memory.read, spine.cat, spine.record never called on a
# live daemon) and B.3 (exactly which six methods the TCP port lets through).
# Sessions used here belong to a channel whose runtime is "void", so nothing
# ever wakes an engine. system.shutdown on the socket is the last call.
source "$(dirname "$0")/lib.sh"
scenario_init 02-rpc-catalog
mark "boot"
# ALADUO_WORK_DIR: channel.file.upload saves under <work dir>/inbox, and the
# work dir defaults to the daemon's cwd, which is the scratch install
W="$ISO/work"; mkdir -p "$W"
daemon_start ALADUO_WORK_DIR="$W" || exit 1
sleep 1

METHODS="system.shutdown system.runtime.info system.status system.config
channel.describe channel.spawn channel.ingress channel.command channel.file.upload channel.file.download channel.pull channel.ack
session.list session.archive session.set_alias session.notify session.wake session.model session.effort session.compact session.config
job.create job.get job.list job.archive job.reschedule job.interrupt
job.manage session.manage notify.send wake.set
usage.get spine.tail spine.cat spine.record memory.read
dashboard no.such.method"

call() { # call <via> <method> <params> [label]
  mark "${4:-$2} [$1] ${3}"
  local r; r="$(rpc_"$1" "$2" "$3")"; echo "   ${r:0:400}"
}

# --- phase A: {} on both listeners ---------------------------------------
for m in $METHODS; do
  call tcp "$m" '{}' "A $m"
  [ "$m" = system.shutdown ] && continue      # the socket call would stop the daemon; it comes last
  call sock "$m" '{}' "A $m"
done

# --- phase B: minimal valid params on the socket -------------------------
SK="scen:void-1"
call sock system.runtime.info '{"source_kind":"scen"}' "B system.runtime.info"
call sock channel.spawn "{\"channel_kind\":\"scen\",\"channel_id\":\"voidch\",\"runtime\":\"void\",\"cwd_abs\":\"$W\",\"session_key\":\"$SK\"}" "B channel.spawn"
call sock channel.describe '{"channel_kind":"scen","channel_id":"voidch"}' "B channel.describe"
call sock channel.ingress "{\"session_key\":\"$SK\",\"channel_id\":\"voidch\",\"text\":\"hello void\",\"idempotency_key\":\"k1\"}" "B channel.ingress"
call sock channel.command "{\"session_key\":\"$SK\",\"channel_id\":\"voidch\",\"command\":\"/status\"}" "B channel.command"
mark "B channel.file.upload [sock]"
UP="$(rpc_sock channel.file.upload "{\"session_key\":\"$SK\",\"name\":\"a.txt\",\"mime\":\"text/plain\",\"content_base64\":\"aGVsbG8K\"}")"; echo "   $UP"
UPATH="$(node -e 'try{const r=JSON.parse(process.argv[1]).result;console.log(r.path||r.abs_path||r.file_path||"")}catch{console.log("")}' "$UP")"
call sock channel.file.download "{\"path\":\"${UPATH:-$W/none}\"}" "B channel.file.download"
call sock channel.pull "{\"session_key\":\"$SK\",\"consumer_id\":\"scen-consumer\",\"wait_ms\":0}" "B channel.pull"
call sock channel.ack "{\"session_key\":\"$SK\",\"consumer_id\":\"scen-consumer\",\"cursor\":\"bogus\"}" "B channel.ack"
call sock session.list '{"deliverable":true}' "B session.list"
call sock session.set_alias "{\"session_key\":\"$SK\",\"display_name\":\"scen void\"}" "B session.set_alias"
call sock session.model "{\"session_key\":\"$SK\"}" "B session.model"
call sock session.effort "{\"session_key\":\"$SK\"}" "B session.effort"
call sock session.config "{\"verb\":\"get\",\"target\":\"$SK\"}" "B session.config"
call sock session.notify "{\"target\":\"$SK\",\"message\":\"note to void\"}" "B session.notify"
call sock session.wake "{\"session_key\":\"$SK\",\"when\":\"@in 30m\",\"context\":\"ping\"}" "B session.wake"
call sock session.compact "{\"target\":\"$SK\"}" "B session.compact"
echo "scenario note" > "$ISO/aladuo/memory/scen-note.md"
call sock memory.read '{"path":"CLAUDE.md"}' "B memory.read board"
call sock memory.read '{"path":"scen-note.md"}' "B memory.read scen file"
call sock memory.read '{"path":"../config"}' "B memory.read outside"
call sock memory.read '{"path":"missing.md"}' "B memory.read missing"
ln -s /etc/hostname "$ISO/aladuo/memory/link-out" 2>/dev/null
call sock memory.read '{"path":"link-out"}' "B memory.read symlink out"
call sock spine.tail '{"limit":3}' "B spine.tail"
call sock spine.record '{"source":"scen","conversation":"c1","payload":{"note":"x"}}' "B spine.record"
call sock spine.record '{"source":"runner","conversation":"c1","payload":{}}' "B spine.record reserved"
call sock spine.cat '{"unfiltered":true,"count_only":true}' "B spine.cat count_only"
call sock spine.cat '{"unfiltered":true,"json":true,"types":["external.record"]}' "B spine.cat json"
call sock job.create '{"id":"scen-far","cron":"0 0 1 1 *","instruction":"never runs in this scenario"}' "B job.create"
call sock job.get '{"id":"scen-far"}' "B job.get"
call sock job.list '{}' "B job.list"
call sock job.reschedule '{"id":"scen-far","when":"2099-01-01T00:00:00Z"}' "B job.reschedule"
call sock job.interrupt '{"id":"no-such-job","reason":"test"}' "B job.interrupt missing"
call sock job.archive '{"id":"scen-far"}' "B job.archive"
call sock usage.get '{"mode":"totals"}' "B usage.get"
call sock session.archive "{\"session_key\":\"$SK\"}" "B session.archive"

# --- phase C: valid params on TCP for the methods it rejected with {} ----
call tcp spine.cat '{"unfiltered":true,"count_only":true}' "C spine.cat"
call tcp memory.read '{"path":"scen-note.md"}' "C memory.read"
call tcp spine.record '{"source":"scen","conversation":"c2","payload":{}}' "C spine.record"
call tcp system.runtime.info '{"source_kind":"scen"}' "C system.runtime.info"
call tcp spine.tail '{"limit":2}' "C spine.tail"

# the HTTP status that carries a read-only rejection
mark "C session.list [tcp] http status"
curl -s -m 5 -o /dev/null -w '%{http_code}\n' -H 'Content-Type: application/json' -XPOST "127.0.0.1:$ALADUO_PORT/rpc" \
  -d '{"jsonrpc":"2.0","id":1,"method":"session.list","params":{}}' | tee "$SDIR/tcp_reject_http_status.txt"
# HTTP routes on the TCP listener that are not RPC methods
for path in healthz readyz dashboard; do
  mark "C GET /$path [tcp]"
  code="$(curl -s -m 5 -o "$SDIR/http_$path.out" -w '%{http_code} %{content_type}' "127.0.0.1:$ALADUO_PORT/$path")"
  echo "   /$path -> $code"; echo "/$path $code" >> "$SDIR/http_routes.txt"
done
mark "save"
save "$ISO/.aladuo/var/events" events
save "$ISO/.aladuo/var/registry" registry
save "$ISO/.aladuo/var/jobs" jobs
mark "D system.shutdown [sock] {}"
rpc_sock system.shutdown '{}'; echo
for _ in $(seq 1 50); do kill -0 "$DPID" 2>/dev/null || break; sleep 0.2; done
if kill -0 "$DPID" 2>/dev/null; then echo "   daemon still running after system.shutdown"; echo running > "$SDIR/after_shutdown.txt"
else echo "   daemon exited after system.shutdown"; echo exited > "$SDIR/after_shutdown.txt"; DPID=""; fi
daemon_stop
report
