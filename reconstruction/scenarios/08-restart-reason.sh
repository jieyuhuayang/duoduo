#!/usr/bin/env bash
# The restart-reason file <varDir>/daemon-restart-reason.json (INTERNALS §6.4;
# settles the "any later boot claims an old file" half of §14.2 item 5).
# The CLI normally writes the file before a restart; here it is written by hand
# between two boots, so no CLI and no launchd is involved.
#   boot 1  no file: claimDaemonRestartReason finds nothing. A void channel
#           session is created (channel.spawn runtime=void + channel.ingress) so
#           a wake target exists that can never run a model.
#   boot 2  well-formed file with wake_targets [nonexistent key, the void session]
#   boot 3  stale file: requested_at in 2020 plus pid/boot_id fields the daemon
#           does not read -- is it still claimed?
#   boot 4  malformed JSON -- deleted without being parsed?
#   boot 5  blank reason and blank wake targets -- deleted, treated as no file?
#   boot 6  empty reason with one wake target (the CLI's --wake without -r)
source "$(dirname "$0")/lib.sh"
scenario_init 08-restart-reason
VAR="$ISO/.aladuo/var"; RFILE="$VAR/daemon-restart-reason.json"
SK="voidinst:room-8"; CH="void-inst-8"; WORK="$ISO/work"; mkdir -p "$WORK"

check_file() { # check_file <label>: record whether the reason file is still there
  if [ -e "$RFILE" ]; then echo "   $1: reason file STILL PRESENT"; echo "$1: present" >> "$SDIR/file-presence.txt"
  else echo "   $1: reason file absent"; echo "$1: absent" >> "$SDIR/file-presence.txt"; fi
  ls -la "$VAR" | grep -i restart >> "$SDIR/file-presence.txt" || true
}
write_reason() { # write_reason <name> <content>: write the file and keep a copy
  printf '%s' "$2" > "$RFILE"; cp "$RFILE" "$SDIR/reason-$1.json"; echo "   wrote reason file ($1)"
}

mark "boot 1 (no reason file)"
daemon_start || exit 1
sleep 1
check_file "boot 1"
mark "create a void channel session"
rpc_sock channel.spawn "{\"channel_kind\":\"voidinst\",\"channel_id\":\"$CH\",\"runtime\":\"void\",\"cwd_abs\":\"$WORK\",\"session_key\":\"$SK\"}"; echo
rpc_sock channel.ingress "{\"session_key\":\"$SK\",\"text\":\"hello before restart\",\"source_kind\":\"voidinst\",\"channel_id\":\"$CH\"}"; echo
rpc_sock session.list '{}' | head -c 600; echo
mark "shutdown 1"
daemon_stop

NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
write_reason A "{\"reason\":\"  scenario 08: config change  \",\"requested_at\":\"$NOW\",\"requested_by_agent\":true,\"wake_targets\":[\"nobody:does-not-exist\",\"$SK\",\"   \"]}"
mark "boot 2 (well-formed file, two wake targets)"
daemon_start || exit 1
sleep 3
check_file "boot 2"
mark "after boot 2: session state and outbox"
rpc_sock session.list '{}' | head -c 800; echo
(cd "$VAR" && find outbox sessions -type f 2>/dev/null | sort) > "$SDIR/files-after-boot2.txt"
cat "$VAR"/events/*.jsonl > "$SDIR/events-after-boot2.jsonl" 2>/dev/null
mark "shutdown 2"
daemon_stop

write_reason B '{"reason":"stale: left by a restart that never booted","requested_at":"2020-01-01T00:00:00.000Z","requested_by_agent":false,"pid":999999,"boot_id":"not-this-boot","started_at":"2020-01-01T00:00:00.000Z","wake_targets":["nobody:stale-target"]}'
touch -d '2020-01-01 00:00:00' "$RFILE"
mark "boot 3 (stale file: requested_at 2020, mtime 2020)"
daemon_start || exit 1
sleep 2
check_file "boot 3"
mark "shutdown 3"
daemon_stop

write_reason C '{"reason": "malformed", "wake_targets": ["x"'
mark "boot 4 (malformed JSON)"
daemon_start || exit 1
sleep 1
check_file "boot 4"
mark "shutdown 4"
daemon_stop

write_reason D '{"reason":"   ","requested_at":"2026-01-01T00:00:00Z","wake_targets":["", "  "]}'
mark "boot 5 (blank reason, blank targets)"
daemon_start || exit 1
sleep 1
check_file "boot 5"
mark "shutdown 5"
daemon_stop
write_reason E "{\"reason\":\"\",\"requested_at\":\"$NOW\",\"requested_by_agent\":false,\"wake_targets\":[\"$SK\"]}"
mark "boot 6 (empty reason, one wake target: what duoduo daemon restart --wake writes without -r)"
daemon_start || exit 1
sleep 2
check_file "boot 6"
mark "shutdown 6"
daemon_stop
cat "$VAR"/events/*.jsonl > "$SDIR/events.jsonl" 2>/dev/null
save "$VAR/outbox" outbox
report
