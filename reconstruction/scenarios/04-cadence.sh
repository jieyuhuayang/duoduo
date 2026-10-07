#!/usr/bin/env bash
# Heartbeat (INTERNALS §11.1, §11.2, §12.2): boot with a 4 s cadence and the
# memory check flag on, let three ticks run, and record per tick
#   - the four deterministic steps of runCadenceTick, in order;
#   - that runMemoryCheckTick writes nothing under memory/ (kernel snapshot
#     before/after) and which task sheets it posts to var/subconscious/*/inbox;
#   - that createMetaSession receives the tick, passes the activity fingerprint
#     on the first tick and skips on the later ones;
#   - what system.status reports as cadence.last_tick.
# No model is reached: ALADUO_DEFAULT_RUNTIME=pi with no pi model configured
# makes every partition the scheduler selects be refused as runtime_unavailable
# before any engine is spawned (createMetaSession, the pi branch).
source "$(dirname "$0")/lib.sh"
scenario_init 04-cadence

# poll cadence.last_tick in the registry status file until it differs from $1
status_file() { echo "$ISO/.aladuo/var/registry/status.json"; }
last_tick() { node -e 'try{const s=require(process.argv[1]);console.log(s.cadence&&s.cadence.last_tick||"")}catch{console.log("")}' "$(status_file)"; }
wait_tick_change() {
  local prev="$1" cur
  for _ in $(seq 1 150); do
    cur="$(last_tick)"; [ -n "$cur" ] && [ "$cur" != "$prev" ] && { echo "$cur"; return 0; }
    sleep 0.2
  done
  echo "TIMEOUT"; return 1
}
snapshot_kernel() {  # $1 = output file: sha256 of every file under memory/ and subconscious/ + git status
  ( cd "$ISO/aladuo" && find memory subconscious -type f -not -path '*/.git/*' | sort | xargs sha256sum
    echo "--- git status --porcelain"; git status --porcelain
    echo "--- git log --oneline"; git log --oneline ) > "$1" 2>&1
}

mark "boot"
daemon_start ALADUO_CADENCE_INTERVAL_MS=4000 ALADUO_EXP_MEMORY_CHECK=1 \
  ALADUO_DEFAULT_RUNTIME=pi ALADUO_LOG_LEVEL=debug || exit 1
[ -f "$(status_file)" ] || { echo "no registry status file at $(status_file)"; ls -R "$ISO/.aladuo/var" | head -30; }
snapshot_kernel "$SDIR/kernel-before.txt"
mark "tcp: system.status before first tick"
rpc_tcp system.status '{}' > "$SDIR/status-before.json"; echo "   last_tick before: '$(last_tick)'"

mark "tick 1"
T1="$(wait_tick_change "")"; echo "   tick 1 last_tick=$T1"
sleep 1
snapshot_kernel "$SDIR/kernel-after-tick1.txt"
mark "tcp: system.status after tick 1"
rpc_tcp system.status '{}' > "$SDIR/status-after-tick1.json"
( cd "$ISO/.aladuo/var" && find subconscious -type f 2>/dev/null | sort ) > "$SDIR/inbox-after-tick1.txt"

mark "tick 2"
T2="$(wait_tick_change "$T1")"; echo "   tick 2 last_tick=$T2"
sleep 1
mark "tick 3"
T3="$(wait_tick_change "$T2")"; echo "   tick 3 last_tick=$T3"
sleep 1
mark "tcp: system.status after tick 3"
rpc_tcp system.status '{}' > "$SDIR/status-after-tick3.json"
node -e 'const r=require(process.argv[1]);console.log("   status.cadence =",JSON.stringify(r.result&&r.result.cadence))' "$SDIR/status-after-tick3.json"
snapshot_kernel "$SDIR/kernel-after.txt"
( cd "$ISO/.aladuo/var" && find subconscious -type f 2>/dev/null | sort ) > "$SDIR/inbox-after.txt"

mark "shutdown"
daemon_stop
echo "   kernel memory/ + subconscious/ diff before -> after:"
diff "$SDIR/kernel-before.txt" "$SDIR/kernel-after.txt" > "$SDIR/kernel-diff.txt" && echo "   (identical)" || sed 's/^/     /' "$SDIR/kernel-diff.txt"
save "$ISO/.aladuo/var/subconscious" task-sheets
save "$ISO/.aladuo/var/meta" meta-state
save "$ISO/.aladuo/var/events" events
save "$ISO/.aladuo/var/registry/status.json" registry-status.json
save "$ISO/aladuo/subconscious/playlist.md" playlist.md
save "$ISO/.aladuo/var/telemetry" telemetry
report
