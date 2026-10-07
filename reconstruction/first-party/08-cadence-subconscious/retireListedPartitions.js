// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: retireListedPartitions  (minified: Fke, daemon.pretty.js:69442)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): The `memory-weaver` subconscious partition is **replaced** by two partitions. Existing partition prompts are never overwritten by an upgrade, so nothing changes until you refresh them
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function retireListedPartitions(e) {
    let t = [];
    for (let n of Jpt) try {
        t.push(await retirePartitionOnce(e, n))
    } catch (r) {
        logWarnMessage(`[init] retiring partition '${n.name}' failed: ${formatYamlErrorMessage(r)}`), t.push({
            partition: n.name,
            action: "skipped",
            reason: "failed"
        })
    }
    return t
}
