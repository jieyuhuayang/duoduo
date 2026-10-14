// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyTargetCandidateLines  (minified: cve, daemon.pretty.js:65409)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): Notify "target not found" error now matches candidates scope-aware (session_key prefix + channel kind), yielding actionable suggestions.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyTargetCandidateLines(groups) {
    let lines = [];
    if (groups.closest.length > 0) {
        lines.push("", "Closest match:");
        for (let match of groups.closest) lines.push(`${pO(match.entry)} — ${match.note}`)
    }
    if (groups.otherForeground.length > 0) {
        lines.push("", "Other foreground candidates:");
        for (let entry of groups.otherForeground) lines.push(pO(entry))
    }
    if (groups.crossClassNearMisses.length > 0) {
        lines.push("", "Background near-miss (NOT user-visible — delivery to these sessions will not reach a user):");
        for (let match of groups.crossClassNearMisses) lines.push(`${pO(match.entry)} — ${match.note}`)
    }
    if (groups.backgroundPeers.length > 0) {
        lines.push("", "Background sessions (jobs / meta):");
        for (let entry of groups.backgroundPeers) lines.push(pO(entry))
    }
    return lines
}
