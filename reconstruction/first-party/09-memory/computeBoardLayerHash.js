// duoduo reconstruction — subsystem: 09-memory
// symbol: computeBoardLayerHash  (minified: Xme, daemon.pretty.js:71444)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoardLayerHash(e) {
    return Yme("sha256").update(JSON.stringify([e ?? ""])).digest("hex")
}
