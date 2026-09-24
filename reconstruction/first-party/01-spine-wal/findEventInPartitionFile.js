// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: findEventInPartitionFile  (minified: ise, daemon.pretty.js:32159)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function findEventInPartitionFile(e, t) {
    try {
        let n = hz(e);
        for await (let r of ds(n)) {
            if (!r) continue;
            let i = mz(r);
            if (i?.id === t) return i
        }
    } catch {
        return null
    }
    return null
}
