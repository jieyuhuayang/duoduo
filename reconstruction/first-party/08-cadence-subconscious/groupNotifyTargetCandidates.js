// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: groupNotifyTargetCandidates  (minified: sve, daemon.pretty.js:65390)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.2 (maps/history_daemon.json)
// locals: 20 renamed — 0 from the code at the binding (rule), 20 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): Notify "target not found" error now matches candidates scope-aware (session_key prefix + channel kind)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function groupNotifyTargetCandidates(target, sessionStates, displayNames, sessionDetails) {
    let entries = Wlt(sessionStates, displayNames, sessionDetails),
        targetIsForeground = target ? rS(target) : !0,
        nearMisses = target ? Zlt(target, entries) : [],
        closest = nearMisses.filter(match => rS(match.entry.session_key) === targetIsForeground),
        crossClassNearMisses = nearMisses.filter(match => rS(match.entry.session_key) !== targetIsForeground),
        matchedKeys = new Set([...closest.map(match => match.entry.session_key), ...crossClassNearMisses.map(match => match.entry.session_key)]),
        remaining = entries.filter(entry => !matchedKeys.has(entry.session_key)),
        otherForeground = rve(remaining.filter(entry => rS(entry.session_key))).slice(0, 3),
        backgroundPeers = rve(remaining.filter(entry => !rS(entry.session_key))).slice(0, 2);
    return {
        closest,
        crossClassNearMisses,
        otherForeground,
        backgroundPeers
    }
}
