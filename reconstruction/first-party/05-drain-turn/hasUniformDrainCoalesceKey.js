// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: hasUniformDrainCoalesceKey  (minified: d0e, daemon.pretty.js:73396)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): Parallel worker-completion notifications are coalesced into one turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasUniformDrainCoalesceKey(entries, sessionKey) {
    let keys = new Set;
    for (let entry of entries) keys.add(computeDrainCoalesceKey(entry.item, entry.event, sessionKey));
    return keys.size === 1
}
