#!/usr/bin/env bash
# Boot, probe both listeners, shut down. The trace is the end-to-end boot
# sequence of INTERNALS §1 and the read-only allowlist of §6.1.
source "$(dirname "$0")/lib.sh"
scenario_init 01-boot
mark "boot"
daemon_start || exit 1
sleep 1
mark "tcp: system.status (allowlisted)"
rpc_tcp system.status '{}' | head -c 300; echo
mark "tcp: session.list (not allowlisted)"
rpc_tcp session.list '{}'; echo
mark "socket: session.list"
rpc_sock session.list '{}'; echo
mark "shutdown"
daemon_stop
save "$ISO/.aladuo" aladuo-home
report
