// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveSessionByKeyOrAlias  (minified: fp, daemon.pretty.js:90948)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.4 (high): `duoduo session notify <target> -m "<msg>"` — wake another session by key or alias
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionByKeyOrAlias(e, t) {
    let n = e.get(t);
    if (n) return {
        ok: !0,
        session_key: n.session_key,
        display_name: hasNonEmptyDisplayName(n) ? n.display_name ?? null : null
    };
    let r = e.list().filter(i => i.display_name === t).map(i => ({
        session_key: i.session_key,
        display_name: hasNonEmptyDisplayName(i) ? i.display_name ?? null : null
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
