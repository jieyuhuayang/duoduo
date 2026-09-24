// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: setSessionAliasAndReindex  (minified: wyt, daemon.pretty.js:89495)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
    await vyt(e, t, r);
    let o = t.get(r);
    return {
        ok: !0,
        session_key: r,
        display_name: fg(o ?? i) ? o?.display_name ?? i.display_name ?? null : null
    }
}
