// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: matchNearMissSessionKey  (minified: eut, daemon.pretty.js:65090)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function matchNearMissSessionKey(e, t) {
    if (t.session_key === e) return null;
    let n = U_e(e),
        r = U_e(t.session_key);
    if (n.length === 0 || r.length === 0) return null;
    if (n.length === r.length && n.length >= 2) {
        let s = 0;
        for (; s < n.length - 1 && n[s] === r[s];) s++;
        if (s === n.length - 1) {
            let a = n[n.length - 1],
                u = r[r.length - 1],
                l = computeBoundedEditDistance(a, u, z_e);
            if (l <= z_e) return {
                entry: t,
                note: `last segment differs by ${l} char${l===1?"":"s"}`
            };
            if (n[0] === "job" && n.length === 3) {
                let c = n[1];
                return {
                    entry: t,
                    note: `readable name "${c}" matches; hash differs — job may have been recreated`
                }
            }
        }
    }
    let i = n[n.length - 1],
        o = r[r.length - 1];
    return i === o && i.length >= 6 && (n[0] !== r[0] || n.length !== r.length) ? {
        entry: t,
        note: `trailing identifier "${i}" matches in a different scope`
    } : null
}
