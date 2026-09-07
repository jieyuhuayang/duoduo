// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runCadenceTick  (minified: Blt, daemon.pretty.js:79617)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runCadenceTick(e) {
    let {
        runMemoryCheckTick: t
    } = await Promise.resolve().then(() => (D4(), Rge));
    await t(e, Date.now());
    try {
        let {
            sweepTombstonedSessionRecords: r
        } = await Promise.resolve().then(() => (cwe(), uwe));
        await r(e)
    } catch (r) {
        J("[cadence] tombstoned-session housekeeping sweep failed (non-fatal)", {
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
    await atomicAppendEvent(e, n), await advanceConsumerWatermark(e, "jobs", n.id, new Date(n.ts)), await ol(e, r => ({
        ...r,
        cadence: {
            ...r.cadence,
            last_tick: n.ts
        }
    }), new Date(n.ts))
}
