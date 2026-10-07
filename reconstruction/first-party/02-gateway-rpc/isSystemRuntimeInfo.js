// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSystemRuntimeInfo  (minified: nR, daemon.pretty.js:31541)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSystemRuntimeInfo(e) {
    return !(!isRecord(e) || typeof e.version != "string" || typeof e.runtime_id != "string" || e.runtime_mode !== "container" && e.runtime_mode !== "host" || typeof e.runtime_dir != "string" || typeof e.work_dir != "string" || typeof e.kernel_dir != "string")
}
