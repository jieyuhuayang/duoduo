// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: rewriteSessionKeyInStateAndMeta  (minified: adt, daemon.pretty.js:69065)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rewriteSessionKeyInStateAndMeta(e, t, n) {
    let r = fs(e, t),
        i = Na(e, t),
        o = await Vwe(r),
        s = await Vwe(i),
        a = o === null ? null : JSON.parse(o),
        u = s === null ? null : (0, mO.default)(s);
    a && a.session_key !== n && (a.session_key = n, await Bt(r, a)), u && u.data.session_key !== n && (u.data.session_key = n, await Dt(i, mO.default.stringify(u.content, u.data)))
}
