// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: groupNotifyTargetCandidates  (minified: sve, daemon.pretty.js:65390)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.2 (maps/history_daemon.json)
// changelog v0.5.0 (medium): Notify "target not found" error now matches candidates scope-aware (session_key prefix + channel kind)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function groupNotifyTargetCandidates(e, t, n, r) {
    let i = Wlt(t, n, r),
        o = e ? rS(e) : !0,
        s = e ? Zlt(e, i) : [],
        a = s.filter(p => rS(p.entry.session_key) === o),
        u = s.filter(p => rS(p.entry.session_key) !== o),
        l = new Set([...a.map(p => p.entry.session_key), ...u.map(p => p.entry.session_key)]),
        c = i.filter(p => !l.has(p.session_key)),
        d = rve(c.filter(p => rS(p.session_key))).slice(0, 3),
        f = rve(c.filter(p => !rS(p.session_key))).slice(0, 2);
    return {
        closest: a,
        crossClassNearMisses: u,
        otherForeground: d,
        backgroundPeers: f
    }
}
