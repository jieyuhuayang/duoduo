// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: resolveRegistryStatusPath  (minified: gR, daemon.pretty.js:32877)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRegistryStatusPath(e) {
    return Sse.join(e.registryDir, "status.json")
}
