#!/usr/bin/env bash
# spine.cat's redact:"external" (INTERNALS §6.1: redactSpineEventForExternal,
# shouldKeepRouteDeliverEvent, stripSpineEventToEnvelope) and the two-write
# append of §5.1 (WAL line, then the by_id index line).
# Writes events of several types on the unix socket without waking a model:
# a void channel session (scen:void-1) takes channel.ingress, channel.command
# and notifies; a pi channel session (scen:pi-1, no pi model configured, so its
# drain is refused before any engine runs) is the non-void route.deliver target;
# spine.record writes external.record (and is tried with reserved sources);
# job.create writes a job.spawn with no session key; session.config set writes
# config.changed. Then reads every event back with spine.cat show (plain and
# redacted) and the whole day with spine.cat --json (plain and redacted) on the
# socket, tries the same on TCP, and reads spine.tail on TCP.
source "$(dirname "$0")/lib.sh"
scenario_init 09-spine-redaction
mark "boot"
W="$ISO/work"; mkdir -p "$W"
daemon_start ALADUO_WORK_DIR="$W" || exit 1
sleep 1
EV="$ISO/.aladuo/var/events"
call() { mark "${4:-$2} [$1] ${3}"; local r; r="$(rpc_"$1" "$2" "$3")"; echo "   ${r:0:300}"; }

mark "setup: two channels"
call sock channel.spawn "{\"channel_kind\":\"scen\",\"channel_id\":\"voidch\",\"runtime\":\"void\",\"cwd_abs\":\"$W\",\"session_key\":\"scen:void-1\"}" "spawn void"
call sock channel.spawn "{\"channel_kind\":\"scen\",\"channel_id\":\"pich\",\"runtime\":\"pi\",\"cwd_abs\":\"$W\",\"session_key\":\"scen:pi-1\"}" "spawn pi"

call sock channel.ingress '{"session_key":"scen:void-1","channel_id":"voidch","text":"SECRET-INGRESS hello void","idempotency_key":"ing-1"}' "ingress to void"
call sock channel.command '{"session_key":"scen:void-1","channel_id":"voidch","command":"/status"}' "command /status on void"
call sock spine.record '{"source":"myapp","conversation":"c1","payload":{"secret":"SECRET-RECORD"}}' "record myapp"
call sock spine.record '{"source":"myapp","conversation":"c1","payload":{"secret":"SECRET-DEDUP"},"dedup_key":"d1"}' "record dedup 1st"
call sock spine.record '{"source":"myapp","conversation":"c1","payload":{"secret":"SECRET-DEDUP-2"},"dedup_key":"d1"}' "record dedup 2nd"
for src in cadence system job subconscious; do
  call sock spine.record "{\"source\":\"$src\",\"conversation\":\"c1\",\"payload\":{}}" "record reserved $src"
done
call sock spine.record '{"source":"myapp","conversation":"a:b","payload":{}}' "record conversation with colon"
call sock session.notify '{"target":"scen:void-1","message":"SECRET-NOTIFY-EXT-VOID","source":"scen-ext"}' "notify external -> void"
call sock session.notify '{"target":"scen:void-1","message":"SECRET-NOTIFY-PI-TO-VOID","caller_session":"scen:pi-1"}' "notify pi-1 -> void (notify)"
call sock session.notify '{"target":"scen:pi-1","message":"SECRET-NOTIFY-VOID-TO-PI","caller_session":"scen:void-1"}' "notify void-1 -> pi (notify, non-void)"
call sock session.notify '{"target":"scen:pi-1","message":"SECRET-NOTIFY-EXT-PI","source":"scen-ext"}' "notify external -> pi"
call sock session.config '{"verb":"set","target":"scen:void-1","set":{"time_gap_minutes":"45"}}' "config set on void"
call sock job.create '{"id":"scen-far","cron":"0 0 1 1 *","instruction":"never runs"}' "job.create"
call sock job.archive '{"id":"scen-far"}' "job.archive"
mark "settle (pi drain)"; sleep 3

D="$(date -u +%F)"
mark "read: plain day json [sock]"
rpc_sock spine.cat '{"unfiltered":true,"json":true}' > "$SDIR/cat_plain.json"
mark "read: redacted day json [sock]"
rpc_sock spine.cat '{"unfiltered":true,"json":true,"redact":"external"}' > "$SDIR/cat_redacted.json"
mark "read: redacted day count [sock]"
rpc_sock spine.cat '{"unfiltered":true,"count_only":true,"redact":"external"}' > "$SDIR/cat_redacted_count.json"
mark "read: plain day count [sock]"
rpc_sock spine.cat '{"unfiltered":true,"count_only":true}' > "$SDIR/cat_plain_count.json"

# per event: show plain vs show redacted, on the socket
mark "read: show each event plain+redacted [sock]"
: > "$SDIR/show_pairs.jsonl"
for id in $(node -e 'for (const l of require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n")) console.log(JSON.parse(l).id)' "$EV/$D.jsonl"); do
  p="$(rpc_sock spine.cat "{\"show\":\"$id\",\"date\":\"$D\"}")"
  r="$(rpc_sock spine.cat "{\"show\":\"$id\",\"date\":\"$D\",\"redact\":\"external\"}")"
  printf '{"id":"%s","plain":%s,"redacted":%s}\n' "$id" "$p" "$r" >> "$SDIR/show_pairs.jsonl"
done

mark "read: spine.cat on TCP"
call tcp spine.cat '{"unfiltered":true,"json":true,"redact":"external"}' "spine.cat redacted"
mark "read: spine.tail on TCP"
rpc_tcp spine.tail '{"limit":100}' > "$SDIR/tail_tcp.json"; head -c 300 "$SDIR/tail_tcp.json"; echo

mark "save"
save "$EV" events
save "$ISO/.aladuo/var/registry/dedup.jsonl" dedup.jsonl
save "$ISO/.aladuo/var/outbox" outbox
save "$ISO/.aladuo/var/sessions" sessions
# §5.1: each by_id line points at exactly one WAL line (partition, byte_offset, byte_len)
node - "$EV" > "$SDIR/wal_check.txt" <<'JS'
const fs=require("fs"),path=require("path"),dir=process.argv[2];
const idx=fs.readFileSync(path.join(dir,"index/by_id.jsonl"),"utf8").trim().split("\n").map(JSON.parse);
const parts=fs.readdirSync(dir).filter(f=>f.endsWith(".jsonl"));
let walLines=0; for(const p of parts) walLines+=fs.readFileSync(path.join(dir,p),"utf8").trim().split("\n").length;
console.log(`partitions=${parts.join(",")} wal_lines=${walLines} index_lines=${idx.length} index_keys=${Object.keys(idx[0]).join(",")}`);
let ok=0,bad=0;
for(const e of idx){const buf=fs.readFileSync(path.join(dir,e.partition));const slice=buf.subarray(e.byte_offset,e.byte_offset+e.byte_len).toString("utf8");
  let j=null;try{j=JSON.parse(slice)}catch{} if(j&&j.id===e.event_id){ok++}else{bad++;console.log("MISMATCH",JSON.stringify(e),slice.slice(0,80))}}
console.log(`index entries resolving to a WAL line with the same id: ${ok}, mismatched: ${bad}`);
JS
cat "$SDIR/wal_check.txt"
daemon_stop
report
# per event: what redact:"external" did to it (spine.cat show, plain vs redacted)
node - "$SDIR/show_pairs.jsonl" > "$SDIR/redaction_table.txt" <<'JS'
const fs=require("fs");
for (const l of fs.readFileSync(process.argv[2],"utf8").trim().split("\n")) {
  const p=JSON.parse(l), pl=JSON.parse(p.plain.result.text);
  const rd=p.redacted.result?JSON.parse(p.redacted.result.text):null;
  const v=rd===null?`DROPPED (${p.redacted.error.code} ${p.redacted.error.data||p.redacted.error.message})`
    :JSON.stringify(rd)===JSON.stringify(pl)?"KEPT AS IS":`STRIPPED to ${JSON.stringify(rd)}`;
  console.log([pl.id,pl.type,pl.session_key??"-",pl.source?.kind??"-",pl.payload?.source_event_type??"-",v].join("\t"));
}
JS
cat "$SDIR/redaction_table.txt" | cut -c1-200
# §5.1: the calls under one atomicAppendEvent (spine.record "record myapp"), in order of entry
node - "$TRACE" > "$SDIR/append_tree.txt" <<'JS'
const L=require("fs").readFileSync(process.argv[2],"utf8").trim().split("\n").map(JSON.parse);
let on=false,root=null;const ev=[];
for(const e of L){ if(e.ev==="mark"){on=e.name.startsWith("record myapp");continue}
  if(on&&e.ev==="enter"){ev.push(e); if(root===null&&e.name==="atomicAppendEvent") root=e.id;} }
const par={};for(const e of ev)par[e.id]=e.parent;
for(const e of ev){let d=0,p=e.id,inR=false;while(p){if(p===root){inR=true;break}p=par[p];d++}
  if(inR) console.log(" ".repeat(d*2)+e.name+" "+JSON.stringify(e.a||[]).slice(0,120));}
JS
