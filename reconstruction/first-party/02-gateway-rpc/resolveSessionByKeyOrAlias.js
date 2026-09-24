// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveSessionByKeyOrAlias  (minified: Kf, daemon.pretty.js:89512)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionByKeyOrAlias(e, t) {
    let n = e.get(t);
    if (n) return {
        ok: !0,
        session_key: n.session_key,
        display_name: fg(n) ? n.display_name ?? null : null
    };
    let r = e.list().filter(i => i.display_name === t).map(i => ({
        session_key: i.session_key,
        display_name: fg(i) ? i.display_name ?? null : null
    }));
    return r.length === 1 ? {
        ok: !0,
        session_key: r[0].session_key,
        display_name: r[0].display_name ?? null
    } : r.length > 1 ? {
        ok: !1,
        reason: "ambiguous",
        candidates: r
    } : {
        ok: !1,
        reason: "not_found"
    }
}
