// duoduo reconstruction — subsystem: 09-memory
// symbol: computeBoardLayerHash  (minified: I6, daemon.pretty.js:76379)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoardLayerHash(e) {
    return Hwe("sha256").update(JSON.stringify([e ?? ""])).digest("hex")
}
