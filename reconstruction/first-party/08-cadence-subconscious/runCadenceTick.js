// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runCadenceTick  (minified: Cbt, daemon.pretty.js:86816)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.3, v0.5.5, v0.5.6, v0.8.0 (maps/history_daemon.json)
// locals: 6 renamed — 4 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runCadenceTick(paths) {
    let {
        runMemoryCheckTick
    } = await Promise.resolve().then(() => (initMemoryCheckTickModule(), zSe));
    await runMemoryCheckTick(paths, Date.now());
    try {
        let {
            sweepTombstonedSessionRecords
        } = await Promise.resolve().then(() => (aIe(), sIe));
        await sweepTombstonedSessionRecords(paths)
    } catch (err) {
        logWarnMessage("[cadence] tombstoned-session housekeeping sweep failed (non-fatal)", {
            error: err
        })
    }
    let spineEvent = createSpineEvent({
        type: "system.cadence_tick",
        source: {
            kind: "system",
            name: "cadence"
        },
        payload: {}
    });
    await atomicAppendEvent(paths, spineEvent), await advanceConsumerWatermark(paths, "jobs", spineEvent.id, new Date(spineEvent.ts)), await updateStatus(paths, status => ({
        ...status,
        cadence: {
            ...status.cadence,
            last_tick: spineEvent.ts
        }
    }), new Date(spineEvent.ts))
}
