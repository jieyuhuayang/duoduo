// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: hasUniformDrainCoalesceKey  (minified: Wxe, daemon.pretty.js:72176)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (medium): Parallel worker-completion notifications are coalesced into one turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasUniformDrainCoalesceKey(e, t) {
    let n = new Set;
    for (let r of e) n.add(computeDrainCoalesceKey(r.item, r.event, t));
    return n.size === 1
}
