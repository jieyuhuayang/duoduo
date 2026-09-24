// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractServedModelFromUsage  (minified: MSe, daemon.pretty.js:70276)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractServedModelFromUsage(e) {
    let t = e?.model?.trim();
    if (!(!t || t === "default")) return t
}
