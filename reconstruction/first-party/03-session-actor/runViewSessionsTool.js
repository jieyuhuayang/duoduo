// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runViewSessionsTool  (minified: Dg, daemon.pretty.js:64941)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (high): `ManageSession` is now `ViewSessions`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runViewSessionsTool(e, t) {
    let {
        paths: n,
        sessionKey: r
    } = t;
    try {
        let i = e && typeof e.session_key == "string" ? e.session_key.trim() : "";
        return i.length === 0 ? await Dlt(n, r) : await Mlt(n, i, t.getSessionStatus)
    } catch (i) {
        return logErrorMessage("[ViewSessions] Tool execution failed", i), `Error: ${i instanceof Error?i.message:String(i)}`
    }
}
