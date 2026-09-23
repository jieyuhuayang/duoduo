// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runCadenceTick  (minified: Bgt, daemon.pretty.js:86443)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runCadenceTick(e) {
    let {
        runMemoryCheckTick: t
    } = await Promise.resolve().then(() => (J6(), kwe));
    await t(e, Date.now());
    try {
        let {
            sweepTombstonedSessionRecords: r
        } = await Promise.resolve().then(() => (h0e(), m0e));
        await r(e)
    } catch (r) {
        Z("[cadence] tombstoned-session housekeeping sweep failed (non-fatal)", {
            error: r
        })
    }
    let n = createSpineEvent({
        type: "system.cadence_tick",
        source: {
            kind: "system",
            name: "cadence"
        },
        payload: {}
    });
    await atomicAppendEvent(e, n), await advanceConsumerWatermark(e, "jobs", n.id, new Date(n.ts)), await Du(e, r => ({
        ...r,
        cadence: {
            ...r.cadence,
            last_tick: n.ts
        }
    }), new Date(n.ts))
}
