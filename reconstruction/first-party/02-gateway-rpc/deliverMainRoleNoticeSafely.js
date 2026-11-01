// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: deliverMainRoleNoticeSafely  (minified: A6, daemon.pretty.js:90231)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 1 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.7 (high): The session is told when it becomes main and tells its owner in its own words.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverMainRoleNoticeSafely(e, t, n) {
    try {
        let r = await e.notify(t, n);
        r.ok || logWarnMessage("[main-role] role notice not delivered", {
            session_key: t,
            reason: r.reason
        })
    } catch (err) {
        logWarnMessage("[main-role] role notice failed", {
            session_key: t,
            error: String(err)
        })
    }
}
