// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: recordExternalSpineEvent  (minified: Eke, daemon.pretty.js:90429)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordExternalSpineEvent(e, t) {
    let n = describeSpineRecordProblem(t);
    if (n !== null) throw new SpineRpcParamsError(renderParamsProblem("spine.record", n));
    let r = t,
        i = checkReservedRecordSource(r.source);
    if (i !== null) return i;
    let o = createSpineEvent({
            type: tA,
            source: {
                kind: r.source
            },
            session_key: `${r.source}:${r.conversation}`,
            ...r.dedup_key !== void 0 ? {
                dedup: {
                    source_id: `${r.conversation}:${r.dedup_key}`
                }
            } : {},
            payload: r.payload
        }),
        s = computeDedupKey(o);
    if (s) {
        let u = await (await loadRegistryDedupStore(e)).checkAndRecordDetailed({
            key: s,
            ts: o.ts,
            event_id: o.id
        });
        if (u.duplicate && u.existing?.event_id) {
            let l = await readEventById(e, u.existing.event_id, {
                notAfter: u.existing.ts
            });
            if (l) return {
                ok: !0,
                event_id: l.id,
                ts: l.ts,
                duplicate: !0
            }
        }
    }
    return await atomicAppendEvent(e, o), {
        ok: !0,
        event_id: o.id,
        ts: o.ts,
        duplicate: !1
    }
}
