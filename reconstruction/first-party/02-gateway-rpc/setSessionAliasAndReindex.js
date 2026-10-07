// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: setSessionAliasAndReindex  (minified: rvt, daemon.pretty.js:90919)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.4 (high): `duoduo session alias <key> "<name>"` — give a session a human label so it is legible in `list`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function setSessionAliasAndReindex(e, t, n) {
    let r = n.session_key.trim(),
        i = await updateSessionDisplayName(e, r, n.display_name);
    if (!i) return {
        ok: !1,
        reason: "not_found",
        session_key: r
    };
    await refreshSessionIndexEntry(e, t, r);
    let o = t.get(r);
    return {
        ok: !0,
        session_key: r,
        display_name: hasNonEmptyDisplayName(o ?? i) ? o?.display_name ?? i.display_name ?? null : null
    }
}
