// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: retireListedPartitions  (minified: Fke, daemon.pretty.js:69442)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): The `memory-weaver` subconscious partition is **replaced** by two partitions. Existing partition prompts are never overwritten by an upgrade, so nothing changes until you refresh them
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function retireListedPartitions(paths) {
    let results = [];
    for (let partition of Jpt) try {
        results.push(await retirePartitionOnce(paths, partition))
    } catch (err) {
        logWarnMessage(`[init] retiring partition '${partition.name}' failed: ${formatYamlErrorMessage(err)}`), results.push({
            partition: partition.name,
            action: "skipped",
            reason: "failed"
        })
    }
    return results
}
