// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runCadenceTick  (minified: $ot, daemon.pretty.js:78130)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runCadenceTick(e) {
    await ah(e), await uh(e);
    let {
        runMemoryCheckTick: t
    } = await Promise.resolve().then(() => (_2(), Mpe));
    await t(e, Date.now());
    try {
        let {
            sweepTombstonedSessionRecords: i
        } = await Promise.resolve().then(() => (J_e(), W_e));
        await i(e)
    } catch (i) {
        Z("[cadence] tombstoned-session housekeeping sweep failed (non-fatal)", {
            error: i
        })
    }
    await mergeCadenceInbox(e);
    let n = await parseCadenceQueue(e),
        r = createSpineEvent({
            type: "system.cadence_tick",
            source: {
                kind: "system",
                name: "cadence"
            },
            payload: {
                count: n.length
            }
        });
    return await atomicAppendEvent(e, r), await advanceConsumerWatermark(e, "jobs", r.id, new Date(r.ts)), await Xa(e, i => ({
        ...i,
        cadence: {
            ...i.cadence,
            last_tick: r.ts
        }
    }), new Date(r.ts)), {
        queueLength: n.length
    }
}
