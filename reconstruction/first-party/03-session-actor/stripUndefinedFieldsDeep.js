// duoduo reconstruction — subsystem: 03-session-actor
// symbol: stripUndefinedFieldsDeep  (minified: af, daemon.pretty.js:35592)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripUndefinedFieldsDeep(e) {
    if (Array.isArray(e)) return e.map(t => stripUndefinedFieldsDeep(t));
    if (e && typeof e == "object") {
        let t = Object.entries(e).filter(([, n]) => n !== void 0).map(([n, r]) => [n, stripUndefinedFieldsDeep(r)]);
        return Object.fromEntries(t)
    }
    return e
}
