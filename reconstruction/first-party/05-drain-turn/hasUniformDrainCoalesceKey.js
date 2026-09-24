// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: hasUniformDrainCoalesceKey  (minified: nke, daemon.pretty.js:71874)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasUniformDrainCoalesceKey(e, t) {
    let n = new Set;
    for (let r of e) n.add(computeDrainCoalesceKey(r.item, r.event, t));
    return n.size === 1
}
