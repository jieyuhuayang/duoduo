// duoduo reconstruction — subsystem: 09-memory
// symbol: computeBoardLayerHash  (minified: $_e, daemon.pretty.js:74089)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoardLayerHash(e) {
    return C_e("sha256").update(JSON.stringify([e ?? ""])).digest("hex")
}
