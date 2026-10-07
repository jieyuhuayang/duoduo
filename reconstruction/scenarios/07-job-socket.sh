#!/usr/bin/env bash
# job.create over the control plane (INTERNALS §10.1, §10.2, §3.1; settles §14.3
# item 7: any local process with socket access can create a job).
#   part 1: TCP refuses job.create (-32601); the unix socket accepts it. A far-future
#           job (@in 30d) is created, listed, read, its files inspected, observed by
#           the 60 s scanner (boot scan + one more), then archived.
#   part 2: job.create carries no runtime field (an extra `runtime` is ignored); the
#           runtime check for jobs can only bite at run time. Two jobs get their
#           runtime hand-edited to `void` and `codx` and their schedule to `once`, so
#           the boot scan spawns them and the drain refuses them (runtime_refused),
#           before any engine starts -- no model is called.
#   part 3: ALADUO_DEFAULT_RUNTIME=void (the value job.create would stamp) stops boot.
source "$(dirname "$0")/lib.sh"
scenario_init 07-job-socket
JOBS="$ISO/.aladuo/var/jobs"
snap() { # snap <label>: list jobs/sessions/events into the scenario dir
  { echo "## $1"; echo "### var/jobs"; (cd "$ISO/.aladuo/var" && find jobs -type f | sort);
    echo "### var/sessions"; (cd "$ISO/.aladuo/var" && find sessions -maxdepth 2 | sort);
    echo "### job events in var/events"; cat "$ISO"/.aladuo/var/events/*.jsonl 2>/dev/null | grep -o '"type":"job[.a-z_]*"[^}]*}' | head -20; echo; } >> "$SDIR/snapshots.txt"
}

mark "boot (first scan)"
daemon_start || exit 1
sleep 2
snap "after boot"

mark "tcp: job.create (expect -32601)"
rpc_tcp job.create '{"id":"scn07-far","cron":"@in 30d","instruction":"never runs"}'; echo
mark "tcp: job.list (allowlisted)"
rpc_tcp job.list '{}'; echo

mark "socket: job.create scn07-far @in 30d"
rpc_sock job.create '{"id":"scn07-far","cron":"@in 30d","instruction":"Scenario 07: a far-future job that must never run.","owner_session":"nobody:scn07"}'; echo
mark "socket: job.create invalid schedule"
rpc_sock job.create '{"id":"scn07-bad","cron":"every tuesday","instruction":"x"}'; echo
mark "socket: job.create duplicate id"
rpc_sock job.create '{"id":"scn07-far","cron":"@in 30d","instruction":"dup"}'; echo
mark "socket: job.create id with path separator"
rpc_sock job.create '{"id":"a/b","cron":"@in 30d","instruction":"x"}'; echo
mark "socket: job.create with extra runtime=void (not in isJobCreateParams)"
rpc_sock job.create '{"id":"scn07-extra","cron":"@in 30d","instruction":"extra runtime field","runtime":"void"}'; echo
mark "socket: job.list / job.get"
rpc_sock job.list '{"summary":true}'; echo
rpc_sock job.get '{"id":"scn07-far"}'; echo
save "$JOBS/active/scn07-far.md" job-far.md
save "$JOBS/active/scn07-far.state.json" job-far.state.json
save "$JOBS/active/scn07-extra.md" job-extra.md
snap "after job.create"

mark "wait for the second scan (65 s)"
sleep 65
save "$JOBS/active/scn07-far.state.json" job-far.state.after-scan.json
snap "after second scan"

mark "socket: job.archive scn07-far"
rpc_sock job.archive '{"id":"scn07-far"}'; echo
rpc_sock job.get '{"id":"scn07-far"}'; echo
rpc_sock job.archive '{"id":"scn07-far"}'; echo
snap "after job.archive"

mark "part 2: create scn07-void and scn07-codx (far future), then stop"
rpc_sock job.create '{"id":"scn07-void","cron":"@in 30d","instruction":"runtime will be void"}'; echo
rpc_sock job.create '{"id":"scn07-codx","cron":"@in 30d","instruction":"runtime will be codx"}'; echo
mark "shutdown 1"
daemon_stop
# hand-edit: runtime -> void / codx, schedule -> once (due at the next scan)
for pair in void:void codx:codx; do
  id="scn07-${pair%%:*}"; rt="${pair##*:}"
  node -e 'const fs=require("fs");const [f,rt]=process.argv.slice(1);let s=fs.readFileSync(f,"utf8");
    s=s.replace(/^runtime:.*$/m,"runtime: "+rt).replace(/^cron:.*$/m,"cron: once");fs.writeFileSync(f,s)' "$JOBS/active/$id.md" "$rt"
  save "$JOBS/active/$id.md" "job-$rt.edited.md"
done

mark "boot 2 (scan spawns the edited jobs)"
daemon_start || exit 1
sleep 8
mark "inspect refused runs"
rpc_sock job.get '{"id":"scn07-void"}'; echo
rpc_sock job.get '{"id":"scn07-codx"}'; echo
save "$JOBS/active/scn07-void.state.json" job-void.state.json
save "$JOBS/active/scn07-codx.state.json" job-codx.state.json
snap "after refused runs"
cat "$ISO"/.aladuo/var/events/*.jsonl > "$SDIR/events.jsonl" 2>/dev/null
mark "shutdown 2"
daemon_stop

mark "part 3: boot with ALADUO_DEFAULT_RUNTIME=void"
if daemon_start ALADUO_DEFAULT_RUNTIME=void; then echo "   UNEXPECTED: daemon booted"; daemon_stop; else echo "   daemon refused to boot (expected)"; fi
mark "end"
save "$ISO/.aladuo/var/jobs" jobs-tree
report
