// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isMergeableDrainBatch  (minified: Jmt, daemon.pretty.js:72164)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (high): Parallel worker-completion notifications are coalesced into one turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMergeableDrainBatch(e, t) {
    return e.length < 2 ? !1 : e.every(i => isChannelMessageEvent(i.event)) ? isMergeableChannelMessageBatch(e, t) : e.every(i => isWorkerTaskNotifyDelivery(i.event)) ? hasUniformDrainCoalesceKey(e, t) : !1
}
