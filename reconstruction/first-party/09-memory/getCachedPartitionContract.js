// duoduo reconstruction — subsystem: 09-memory
// symbol: getCachedPartitionContract  (minified: nO, daemon.pretty.js:67284)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function getCachedPartitionContract(e, t) {
    e.contracts || (e.contracts = new Map);
    let n = e.contracts.get(t);
    return n === void 0 && (n = readPartitionContract(e.subconsciousDir, t), e.contracts.set(t, n)), n
}
