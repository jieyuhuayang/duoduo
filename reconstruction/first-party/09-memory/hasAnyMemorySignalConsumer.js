// duoduo reconstruction — subsystem: 09-memory
// symbol: hasAnyMemorySignalConsumer  (minified: jve, daemon.pretty.js:67417)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasAnyMemorySignalConsumer(e) {
    let t = Object.values(Un);
    for (let n of C6) {
        let r = getCachedPartitionContract(e, n);
        if (t.some(i => enforceContractGate(i, r, e.flagFallback) === null)) return !0
    }
    return !1
}
