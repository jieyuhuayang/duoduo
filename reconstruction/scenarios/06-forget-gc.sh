#!/usr/bin/env bash
# Orphan forget GC (INTERNALS §12.3, §14.3 item 2). forgetMemoryEntry runs its
# git commands with the kernel's memory/ directory as cwd, while
# `git diff --cached --name-only` prints repo-root-relative paths; §14.3 says
# the path-limited commit therefore fails, the deletion stays staged and no
# "forget:" commit appears. Four boots on one isolated HOME:
#   boot 1  seed the kernel (genesis commit), no ticks
#   boot 2  one committed, clean STALE orphan topics/stale-orphan.md (mtime and
#           commit dates 3 days back), FORGET+CHECK on, 4 s cadence: does the
#           commit succeed?
#   boot 3  worktree restored, plus a second STALE orphan topics/stale-edited.md
#           with an uncommitted edit: does the whole batch fail (§12.3 "批次中任一
#           文件……有未提交或已暂存的修改时，git rm 整体失败")?
#   boot 4  only an untracked STALE orphan: §12.3 says git rm --ignore-unmatch
#           leaves it alone ("从未提交过的 STALE 文件不会被删除")
# Every git process the daemon spawns is logged with GIT_TRACE2_EVENT (argv,
# exit code); spawnSync calls are not first-party, so the function trace alone
# does not show them. No model is reached: ALADUO_DEFAULT_RUNTIME=pi with no pi
# model makes every partition the scheduler selects be refused before spawn.
source "$(dirname "$0")/lib.sh"
scenario_init 06-forget-gc
K="$ISO/aladuo"
gk() { git -C "$K" -c user.name=scenario -c user.email=scenario@local "$@"; }
THREE_DAYS_AGO="$(date -u -d '3 days ago' '+%Y-%m-%dT%H:%M:%SZ')"
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
git_state() {  # $1 = label -> appends worktree / index / log to git-state.txt
  { echo "===== $1"
    echo "--- ls memory/topics"; ls -la --time-style=full-iso "$K/memory/topics" 2>&1
    echo "--- git status --porcelain"; gk status --porcelain
    echo "--- git diff --cached --name-status"; gk diff --cached --name-status
    echo "--- git log --format='%h %ad %s' --date=iso"; gk log --format='%h %ad %s' --date=iso
    echo; } >> "$SDIR/git-state.txt" 2>&1
}
boot_ticks() {  # $1 = label: boot with forget on, wait two ticks, stop
  local L="$1" GT="$SDIR/git-trace2-$1.jsonl" t0
  t0="$(last_tick)"   # the registry status file survives restarts: wait for a tick newer than the last boot's
  mark "$L: boot (CHECK=1 FORGET=1, 4 s cadence)"
  daemon_start ALADUO_CADENCE_INTERVAL_MS=4000 ALADUO_EXP_MEMORY_CHECK=1 ALADUO_EXP_MEMORY_FORGET=1 \
    ALADUO_DEFAULT_RUNTIME=pi ALADUO_LOG_LEVEL=debug GIT_TRACE2_EVENT="$GT" || exit 1
  mark "$L: tick 1"
  local t1; t1="$(wait_tick_change "$t0")"; echo "   tick 1 last_tick=$t1"
  sleep 0.5; git_state "$L after tick 1"
  mark "$L: tick 2"
  local t2; t2="$(wait_tick_change "$t1")"; echo "   tick 2 last_tick=$t2"
  sleep 0.5
  mark "$L: system.status"
  rpc_tcp system.status '{}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s).result;console.log("   memory_check:",JSON.stringify({check:r.memory_check.check_enabled,forget:r.memory_check.forget_enabled}))})'
  mark "$L: shutdown"
  daemon_stop
  git_state "$L after shutdown"
  # one line per git process: argv and exit code, from the trace2 event stream
  [ -f "$GT" ] && node -e '
    const fs=require("fs"); const byS={};
    for (const l of fs.readFileSync(process.argv[1],"utf8").split("\n").filter(Boolean)) { const e=JSON.parse(l);
      const s=e.sid.split("/")[0]+"/"+e.sid.split("/").slice(1).join("/"); (byS[e.sid] ||= {sid:e.sid,t:e.time});
      if (e.event==="start") byS[e.sid].argv=e.argv.join(" ");
      if (e.event==="exit") byS[e.sid].code=e.code;
      if (e.event==="def_repo") byS[e.sid].worktree=e.worktree; }
    for (const p of Object.values(byS).filter(p=>p.argv&&!p.sid.includes("/"))) console.log(p.t, "exit="+p.code, p.argv);
  ' "$GT" > "$SDIR/git-commands-$L.txt"
  echo "   daemon git commands ($L):"; grep -v "rev-parse --is-inside\|show-toplevel" "$SDIR/git-commands-$L.txt" | sed 's/^/     /' | grep -i " rm \| diff \| commit\| reset\| checkout" || echo "     (no rm/diff/commit/reset/checkout)"
}

# ---- boot 1: seed the kernel
mark "boot 1: seed kernel"
daemon_start ALADUO_DEFAULT_RUNTIME=pi || exit 1
mark "boot 1: shutdown"
daemon_stop
git_state "after seed"

# ---- set up one committed, clean STALE orphan
mkdir -p "$K/memory/topics"
printf '# Stale orphan\n\nA topic nothing links to, written three days ago.\n' > "$K/memory/topics/stale-orphan.md"
gk add memory/topics/stale-orphan.md
GIT_AUTHOR_DATE="$THREE_DAYS_AGO" GIT_COMMITTER_DATE="$THREE_DAYS_AGO" gk commit -q -m "scenario: add stale-orphan" -- memory/topics/stale-orphan.md
touch -d "$THREE_DAYS_AGO" "$K/memory/topics/stale-orphan.md"
save "$K/memory/CLAUDE.md" memory-board.md
git_state "setup A (one clean stale orphan)"

# ---- boot 2: does the forget commit succeed?
boot_ticks A
save "$ISO/.aladuo/var/subconscious" task-sheets-A

# reproduce the three commands by hand on a copy, to capture git's stderr
mark "manual replay on a copy"
REPLAY="$SDIR/manual-replay.txt"; RK="$ISO/replay-kernel"
rm -rf "$RK"; cp -a "$K" "$RK"; git -C "$RK" reset -q --hard
{ export LC_ALL=C
  echo "# cwd = <kernel>/memory, same argv as forgetMemoryEntry"
  cd "$RK/memory"
  echo '$ git rm --ignore-unmatch -- topics/stale-orphan.md'; git rm --ignore-unmatch -- topics/stale-orphan.md; echo "exit=$?"
  echo '$ git diff --cached --name-only --diff-filter=D -- topics/stale-orphan.md'; out="$(git diff --cached --name-only --diff-filter=D -- topics/stale-orphan.md)"; rc=$?; echo "$out"; echo "exit=$rc"
  echo "\$ git -c user.name=aladuo -c user.email=aladuo@local commit -m 'forget: stale-orphan, stale orphan never linked' -- $out"
  git -c user.name=aladuo -c user.email=aladuo@local commit -m 'forget: stale-orphan, stale orphan never linked' -- $out; echo "exit=$?"
  echo "\$ git reset --quiet -- $out"; git reset --quiet -- $out; echo "exit=$?"
  echo "\$ git checkout -- $out"; git checkout -- $out; echo "exit=$?"
  echo '$ git status --porcelain'; git status --porcelain
  cd - >/dev/null; unset LC_ALL; } > "$REPLAY" 2>&1
sed 's/^/   /' "$REPLAY"
rm -rf "$RK"

# ---- set up B: restore worktree and index, add a second STALE orphan with an uncommitted edit
gk reset -q --hard
touch -d "$THREE_DAYS_AGO" "$K/memory/topics/stale-orphan.md"
printf '# Stale edited\n\nAnother unlinked topic.\n' > "$K/memory/topics/stale-edited.md"
gk add memory/topics/stale-edited.md
GIT_AUTHOR_DATE="$THREE_DAYS_AGO" GIT_COMMITTER_DATE="$THREE_DAYS_AGO" gk commit -q -m "scenario: add stale-edited" -- memory/topics/stale-edited.md
printf 'An uncommitted local edit.\n' >> "$K/memory/topics/stale-edited.md"
touch -d "$THREE_DAYS_AGO" "$K/memory/topics/stale-edited.md"
git_state "setup B (clean stale-orphan + locally modified stale-edited)"
# git's own message for the batch, on a copy (the daemon discards spawnSync stderr)
RK="$ISO/replay-kernel"; rm -rf "$RK"; cp -a "$K" "$RK"
{ echo "# cwd = <kernel>/memory"; echo '$ git rm --ignore-unmatch -- topics/stale-edited.md topics/stale-orphan.md'
  ( cd "$RK/memory" && LC_ALL=C git rm --ignore-unmatch -- topics/stale-edited.md topics/stale-orphan.md; echo "exit=$?"; LC_ALL=C git status --porcelain ); } > "$SDIR/manual-replay-B.txt" 2>&1
sed 's/^/   /' "$SDIR/manual-replay-B.txt"; rm -rf "$RK"

# ---- boot 3: does the whole batch fail?
boot_ticks B
save "$ISO/.aladuo/var/subconscious" task-sheets-B
save "$K/memory/topics" topics-after-B

# ---- set up C: the two tracked orphans removed by a scenario commit; one STALE orphan never committed
gk checkout -q -- memory/topics/stale-edited.md
gk rm -q -- memory/topics/stale-edited.md memory/topics/stale-orphan.md
gk commit -q -m "scenario: drop tracked orphans" -- memory/topics/stale-edited.md memory/topics/stale-orphan.md
printf '# Stale untracked\n\nNever committed.\n' > "$K/memory/topics/stale-untracked.md"
touch -d "$THREE_DAYS_AGO" "$K/memory/topics/stale-untracked.md"
git_state "setup C (one untracked stale orphan)"

# ---- boot 4: an untracked STALE orphan is not deleted
boot_ticks C
save "$K/memory/topics" topics-after-C
report
