// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readOrSetSessionEffort  (minified: Eyt, daemon.pretty.js:89737)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readOrSetSessionEffort(e, t, n) {
    let r = n.session_key.trim(),
        i = resolveSessionByKeyOrAlias(e, r);
    if (!i.ok) return i.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: r,
        candidates: i.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: r
    };
    let o = classifySessionKeyKind(i.session_key);
    return o !== "channel" ? {
        ok: !1,
        reason: "forbidden_kind",
        target: r,
        session_key: i.session_key,
        kind: o
    } : isSessionArchiving(i.session_key) ? {
        ok: !1,
        reason: "archiving",
        target: r,
        session_key: i.session_key
    } : {
        ...Object.hasOwn(n, "effort") ? await t.setSessionEffort(i.session_key, n.effort ?? null) : await t.getSessionEffort(i.session_key),
        session_key: i.session_key
    }
}
