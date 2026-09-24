// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: retireListedPartitions  (minified: Gwe, daemon.pretty.js:69151)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function retireListedPartitions(e) {
    let t = [];
    for (let n of cdt) try {
        t.push(await retirePartitionOnce(e, n))
    } catch (r) {
        Z(`[init] retiring partition '${n.name}' failed: ${Wi(r)}`), t.push({
            partition: n.name,
            action: "skipped",
            reason: "failed"
        })
    }
    return t
}
