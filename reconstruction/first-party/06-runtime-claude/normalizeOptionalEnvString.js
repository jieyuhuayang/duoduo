// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: normalizeOptionalEnvString  (minified: vw, daemon.pretty.js:55297)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeOptionalEnvString(e) {
    if (!e) return;
    let t = e.trim();
    return t.length > 0 ? t : void 0
}
