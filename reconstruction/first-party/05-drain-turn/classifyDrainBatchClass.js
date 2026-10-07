// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: classifyDrainBatchClass  (minified: Cxe, daemon.pretty.js:72203)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.1 (medium): A message you send while the agent is mid-turn on something it started by itself now gets its own turn. It used to be folded into that turn
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyDrainBatchClass(e) {
    return e ? isWorkerTaskNotifyDelivery(e) ? "worker-notify" : isChannelMessageEvent(e) ? Wmt : CW : CW
}
