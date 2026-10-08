#!/usr/bin/env bash
# Copyright 2026 openduo
# SPDX-License-Identifier: FSL-1.1-Apache-2.0
#
# Create one ambient room through the daemon's channel.spawn method.
# Fallback for a channel without `duoduo channel ambient room add`; prefer the verb.
#
# Usage:
#   create-room.sh <room_id> <absolute workspace path> <runtime> [--pocket]
#
# --pocket writes the pocket room's instance prompt (short answers, no markdown) into the
# room's descriptor.md body, only when that body is empty.
#
# Environment:
#   ALADUO_DAEMON_SOCKET  daemon socket (default $HOME/.aladuo/run/daemon.sock)
#   ALADUO_RUNTIME_DIR    runtime directory (default: asked from the daemon)
#
# Exit codes: 2 bad arguments, 3 room exists, 4 daemon unreachable or refused.

set -euo pipefail

die() {
  echo "create-room: $2" >&2
  exit "$1"
}

usage() {
  echo "usage: create-room.sh <room_id> <absolute workspace path> <runtime> [--pocket]" >&2
  exit 2
}

[ "$#" -ge 3 ] && [ "$#" -le 4 ] || usage
room_id=$1
workspace=$2
runtime=$3
pocket=0
if [ "$#" -eq 4 ]; then
  [ "$4" = "--pocket" ] || usage
  pocket=1
fi

[[ "$room_id" =~ ^[A-Za-z0-9_-]+$ ]] || die 2 "room id must match [A-Za-z0-9_-]+: '$room_id'"
# The daemon limits channel ids to 128 characters, and "ambient-" counts toward it.
[ "${#room_id}" -le 120 ] || die 2 "room id is longer than 120 characters"
case "$workspace" in
  /*) ;;
  *) die 2 "workspace must be an absolute path: '$workspace'" ;;
esac
[ -d "$workspace" ] || die 2 "workspace is not an existing directory: '$workspace'"
# The runtime is not checked here: the daemon decides which runtimes it accepts
# and refuses an unknown one in its channel.spawn reply.
[ -n "$runtime" ] || die 2 "runtime is required"
command -v curl >/dev/null || die 4 "curl not found"
command -v node >/dev/null || die 4 "node not found"

socket=${ALADUO_DAEMON_SOCKET:-$HOME/.aladuo/run/daemon.sock}
[ -S "$socket" ] || die 4 "no daemon socket at $socket (is the daemon running? duoduo daemon status)"

# Only the Unix socket accepts channel.spawn; the read-only TCP port refuses it.
rpc() {
  curl -sS --fail --unix-socket "$socket" -H 'content-type: application/json' \
    -d "$1" http://localhost/rpc
}

# Print the JSON-RPC result, or exit 4 with the daemon's error.
result_of() {
  node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const r = JSON.parse(s);
      if (r.error) { console.error(JSON.stringify(r.error)); process.exit(4); }
      console.log(JSON.stringify(r.result));
    });'
}

runtime_dir=${ALADUO_RUNTIME_DIR:-}
if [ -z "$runtime_dir" ]; then
  info=$(rpc '{"jsonrpc":"2.0","id":1,"method":"system.runtime.info","params":{"source_kind":"ambient"}}') ||
    die 4 "daemon did not answer system.runtime.info on $socket"
  runtime_dir=$(printf '%s' "$info" | result_of | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const v = JSON.parse(s).runtime_dir; if (!v) process.exit(4); console.log(v); });') ||
    die 4 "system.runtime.info carried no runtime_dir"
fi

room_dir="$runtime_dir/var/channels/ambient-$room_id"
[ ! -e "$room_dir" ] || die 3 "room exists: $room_dir"

params=$(ROOM="$room_id" CWD="$workspace" RT="$runtime" node -e '
  console.log(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "channel.spawn", params: {
    channel_kind: "ambient", channel_id: "ambient-" + process.env.ROOM,
    cwd_abs: process.env.CWD, runtime: process.env.RT } }));')
reply=$(rpc "$params") || die 4 "daemon did not answer channel.spawn on $socket"
printf '%s' "$reply" | result_of || die 4 "channel.spawn refused"

[ -d "$room_dir" ] || die 4 "channel.spawn answered but $room_dir does not exist"
echo "created $room_dir"

if [ "$pocket" -eq 1 ]; then
  descriptor="$room_dir/descriptor.md"
  [ -f "$descriptor" ] || die 4 "no descriptor.md in $room_dir; add the pocket body by hand"
  body=$(node -e '
    const t = require("fs").readFileSync(process.argv[1], "utf8");
    const m = /^---\n[\s\S]*?\n---\n?/.exec(t);
    console.log((m ? t.slice(m[0].length) : t).trim().length);' "$descriptor")
  if [ "$body" != "0" ]; then
    echo "descriptor.md already has a body; pocket note not written" >&2
  else
    cat >>"$descriptor" <<'EOF'

这个房间是随身设备的房间：人按住口袋里的小设备说话，或者在手机上打字、说话。
你的回答总会被读：手机上显示完整文字，最新一条回答还会显示在设备 240×320 的小屏上，
人多半是边走边看。手机开着环境模式时，回答还会被念出来。所以：

- 回答要短，第一句就是结论，最好一屏就能看完
- 不要 markdown：不要星号、井号、列表符号、代码块、表格
- 细节可以写，完整文字在手机上；但别让人在小屏上翻好几页才看到结论
- 写法要同时适合看和听：读起来清楚，念出来也顺
EOF
    echo "wrote the pocket note into $descriptor"
  fi
fi
