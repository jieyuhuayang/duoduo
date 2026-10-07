// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyTargetCandidateLines  (minified: ave, daemon.pretty.js:65408)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (high): Notify "target not found" error now matches candidates scope-aware (session_key prefix + channel kind), yielding actionable suggestions.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyTargetCandidateLines(e) {
    let t = [];
    if (e.closest.length > 0) {
        t.push("", "Closest match:");
        for (let n of e.closest) t.push(`${pO(n.entry)} — ${n.note}`)
    }
    if (e.otherForeground.length > 0) {
        t.push("", "Other foreground candidates:");
        for (let n of e.otherForeground) t.push(pO(n))
    }
    if (e.crossClassNearMisses.length > 0) {
        t.push("", "Background near-miss (NOT user-visible — delivery to these sessions will not reach a user):");
        for (let n of e.crossClassNearMisses) t.push(`${pO(n.entry)} — ${n.note}`)
    }
    if (e.backgroundPeers.length > 0) {
        t.push("", "Background sessions (jobs / meta):");
        for (let n of e.backgroundPeers) t.push(pO(n))
    }
    return t
}
