// duoduo reconstruction — subsystem: 09-memory
// symbol: computeBoardLayerHash  (minified: zme, daemon.pretty.js:71262)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoardLayerHash(e) {
    return Lme("sha256").update(JSON.stringify([e ?? ""])).digest("hex")
}
