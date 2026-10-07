// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: selectProfileIssuesForModel  (minified: Wg, daemon.pretty.js:70017)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function selectProfileIssuesForModel(e, t) {
    if (!t || t.length === 0) return [];
    let n = mmt(e);
    return n === null ? [] : t.filter(r => r.model === void 0 || r.model === n)
}
