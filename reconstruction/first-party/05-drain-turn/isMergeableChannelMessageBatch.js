// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isMergeableChannelMessageBatch  (minified: dft, daemon.pretty.js:71866)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMergeableChannelMessageBatch(e, t) {
    for (let n of e) {
        let r = n.prompt.trim();
        if (!r || r.startsWith("/")) return !1
    }
    return hasUniformDrainCoalesceKey(e, t)
}
