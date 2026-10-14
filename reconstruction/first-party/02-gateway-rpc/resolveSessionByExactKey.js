// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveSessionByExactKey  (minified: uvt, daemon.pretty.js:90982)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionByExactKey(sessionIndex, sessionKey) {
    let entry = sessionIndex.get(sessionKey);
    return entry ? {
        ok: !0,
        session_key: entry.session_key,
        display_name: hasNonEmptyDisplayName(entry) ? entry.display_name ?? null : null
    } : {
        ok: !1,
        reason: "not_found"
    }
}
