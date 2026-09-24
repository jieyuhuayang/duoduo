// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isDaemonRuntimeInfo  (minified: I0, daemon.pretty.js:31541)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isDaemonRuntimeInfo(e) {
    return !(!Nt(e) || typeof e.version != "string" || typeof e.runtime_id != "string" || e.runtime_mode !== "container" && e.runtime_mode !== "host" || typeof e.runtime_dir != "string" || typeof e.work_dir != "string" || typeof e.kernel_dir != "string")
}
