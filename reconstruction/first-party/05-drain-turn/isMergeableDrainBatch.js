// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isMergeableDrainBatch  (minified: Zmt, daemon.pretty.js:72165)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (high): Parallel worker-completion notifications are coalesced into one turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMergeableDrainBatch(entries, sessionKey) {
    return entries.length < 2 ? !1 : entries.every(entry => isChannelMessageEvent(entry.event)) ? isMergeableChannelMessageBatch(entries, sessionKey) : entries.every(entry => isWorkerTaskNotifyDelivery(entry.event)) ? hasUniformDrainCoalesceKey(entries, sessionKey) : !1
}
