// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveSessionByExactKey  (minified: ivt, daemon.pretty.js:90936)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionByExactKey(e, t) {
    let n = e.get(t);
    return n ? {
        ok: !0,
        session_key: n.session_key,
        display_name: hasNonEmptyDisplayName(n) ? n.display_name ?? null : null
    } : {
        ok: !1,
        reason: "not_found"
    }
}
