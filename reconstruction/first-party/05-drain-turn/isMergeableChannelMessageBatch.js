// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isMergeableChannelMessageBatch  (minified: Gmt, daemon.pretty.js:72168)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.5 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMergeableChannelMessageBatch(e, t) {
    for (let n of e) {
        let r = n.prompt.trim();
        if (!r || r.startsWith("/")) return !1
    }
    return hasUniformDrainCoalesceKey(e, t)
}
