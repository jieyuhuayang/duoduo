// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: groupNotifyTargetCandidates  (minified: q_e, daemon.pretty.js:65132)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function groupNotifyTargetCandidates(e, t, n, r) {
    let i = Xat(t, n, r),
        o = e ? $w(e) : !0,
        s = e ? tut(e, i) : [],
        a = s.filter(p => $w(p.entry.session_key) === o),
        u = s.filter(p => $w(p.entry.session_key) !== o),
        l = new Set([...a.map(p => p.entry.session_key), ...u.map(p => p.entry.session_key)]),
        c = i.filter(p => !l.has(p.session_key)),
        d = F_e(c.filter(p => $w(p.session_key))).slice(0, 3),
        f = F_e(c.filter(p => !$w(p.session_key))).slice(0, 2);
    return {
        closest: a,
        crossClassNearMisses: u,
        otherForeground: d,
        backgroundPeers: f
    }
}
