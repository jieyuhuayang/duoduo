// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runCadenceTick  (minified: Iet, daemon.pretty.js:74948)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runCadenceTick(e) {
    await gm(e), await _m(e);
    let {
        runMemoryCheckTick: t
    } = await Promise.resolve().then(() => (EU(), Rle));
    await t(e, Date.now());
    try {
        let {
            sweepTombstonedSessionRecords: i
        } = await Promise.resolve().then(() => (mhe(), phe));
        await i(e)
    } catch (i) {
        se("[cadence] tombstoned-session housekeeping sweep failed (non-fatal)", {
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
    return await atomicAppendEvent(e, r), await advanceConsumerWatermark(e, "jobs", r.id, new Date(r.ts)), await Aa(e, i => ({
        ...i,
        cadence: {
            ...i.cadence,
            last_tick: r.ts
        }
    }), new Date(r.ts)), {
        queueLength: n.length
    }
}
