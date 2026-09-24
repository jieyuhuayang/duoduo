// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyTargetCandidateLines  (minified: B_e, daemon.pretty.js:65150)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyTargetCandidateLines(e) {
    let t = [];
    if (e.closest.length > 0) {
        t.push("", "Closest match:");
        for (let n of e.closest) t.push(`${$$(n.entry)} — ${n.note}`)
    }
    if (e.otherForeground.length > 0) {
        t.push("", "Other foreground candidates:");
        for (let n of e.otherForeground) t.push($$(n))
    }
    if (e.crossClassNearMisses.length > 0) {
        t.push("", "Background near-miss (NOT user-visible — delivery to these sessions will not reach a user):");
        for (let n of e.crossClassNearMisses) t.push(`${$$(n.entry)} — ${n.note}`)
    }
    if (e.backgroundPeers.length > 0) {
        t.push("", "Background sessions (jobs / meta):");
        for (let n of e.backgroundPeers) t.push($$(n))
    }
    return t
}
