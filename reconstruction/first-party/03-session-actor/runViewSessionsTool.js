// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runViewSessionsTool  (minified: Dg, daemon.pretty.js:64942)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 3 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (high): `ManageSession` is now `ViewSessions`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runViewSessionsTool(input, ctx) {
    let {
        paths,
        sessionKey
    } = ctx;
    try {
        let targetSessionKey = input && typeof input.session_key == "string" ? input.session_key.trim() : "";
        return targetSessionKey.length === 0 ? await jlt(paths, sessionKey) : await Llt(paths, targetSessionKey, ctx.getSessionStatus)
    } catch (err) {
        return logErrorMessage("[ViewSessions] Tool execution failed", err), `Error: ${err instanceof Error?err.message:String(err)}`
    }
}
