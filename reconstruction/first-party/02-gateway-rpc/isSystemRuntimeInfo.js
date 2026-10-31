// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSystemRuntimeInfo  (minified: _R, daemon.pretty.js:32737)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.3, v0.3.7, v0.4.3 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.7 (high): **daemon**: Expose runtime version in `system.runtime.info` RPC and ATC dashboard.
// changelog v0.4.3 (high): feat: add `kernel_dir` to `system.runtime.info` for contrib path discovery
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSystemRuntimeInfo(info) {
    return !(!isRecord(info) || typeof info.version != "string" || typeof info.runtime_id != "string" || info.runtime_mode !== "container" && info.runtime_mode !== "host" || typeof info.runtime_dir != "string" || typeof info.work_dir != "string" || typeof info.kernel_dir != "string")
}
