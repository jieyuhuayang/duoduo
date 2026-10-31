// duoduo reconstruction — subsystem: 03-session-actor
// symbol: issueWorkerToolContextToken  (minified: kC, daemon.pretty.js:57128)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function issueWorkerToolContextToken(context) {
    let token = qat(32).toString("hex"),
        previousToken = b_e.get(context.session_key);
    return previousToken && VV.delete(previousToken), b_e.set(context.session_key, token), VV.set(token, {
        ...context
    }), token
}
