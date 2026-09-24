// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: normalizeOptionalEnvString  (minified: Zv, daemon.pretty.js:54981)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeOptionalEnvString(e) {
    if (!e) return;
    let t = e.trim();
    return t.length > 0 ? t : void 0
}
