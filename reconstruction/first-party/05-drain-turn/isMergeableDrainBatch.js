// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isMergeableDrainBatch  (minified: cft, daemon.pretty.js:71862)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMergeableDrainBatch(e, t) {
    return e.length < 2 ? !1 : e.every(i => EO(i.event)) ? isMergeableChannelMessageBatch(e, t) : e.every(i => isWorkerTaskNotifyDelivery(i.event)) ? hasUniformDrainCoalesceKey(e, t) : !1
}
