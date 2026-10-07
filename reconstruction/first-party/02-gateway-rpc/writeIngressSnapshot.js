// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: writeIngressSnapshot  (minified: zet, daemon.pretty.js:88165)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeIngressSnapshot(e, t, n) {
    let r = hashSessionKey(t.sessionKey),
        i = mf.join(e.varIngressDir, r),
        o = mf.join(i, `${n.id}.json`),
        s = t.rawPayload ?? {
            session_key: t.sessionKey,
            source_kind: t.sourceKind,
            source_name: t.sourceName,
            text: t.text,
            dedup_source_id: t.dedupSourceId,
            attachments: t.attachments ?? []
        },
        a = Date.now();
    return await writeJsonFileAtomic(o, s), await recordTelemetryMetric(e, "ingress_snapshot_ms", Date.now() - a, {
        eventId: n.id,
        sessionKey: t.sessionKey,
        sourceKind: t.sourceKind
    }), o
}
