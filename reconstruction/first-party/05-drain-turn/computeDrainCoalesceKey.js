// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: computeDrainCoalesceKey  (minified: pft, daemon.pretty.js:71909)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeDrainCoalesceKey(e, t, n) {
    let {
        primaryTargetSessionKey: r,
        fanoutTargets: i
    } = uke(e, t, n);
    return `${r}|${i.join(",")}|${resolveEventSourceChannelId(t)}`
}
