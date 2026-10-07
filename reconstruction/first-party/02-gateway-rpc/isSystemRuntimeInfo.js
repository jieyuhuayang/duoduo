// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSystemRuntimeInfo  (minified: nR, daemon.pretty.js:31541)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.3, v0.3.7, v0.4.3 (maps/history_daemon.json)
// changelog v0.3.7 (high): **daemon**: Expose runtime version in `system.runtime.info` RPC and ATC dashboard.
// changelog v0.4.3 (high): feat: add `kernel_dir` to `system.runtime.info` for contrib path discovery
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSystemRuntimeInfo(e) {
    return !(!isRecord(e) || typeof e.version != "string" || typeof e.runtime_id != "string" || e.runtime_mode !== "container" && e.runtime_mode !== "host" || typeof e.runtime_dir != "string" || typeof e.work_dir != "string" || typeof e.kernel_dir != "string")
}
