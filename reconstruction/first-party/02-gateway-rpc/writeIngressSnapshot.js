// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: writeIngressSnapshot  (minified: VXe, daemon.pretty.js:87787)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeIngressSnapshot(e, t, n) {
    let r = hashSessionKey(t.sessionKey),
        i = ef.join(e.varIngressDir, r),
        o = ef.join(i, `${n.id}.json`),
        s = t.rawPayload ?? {
            session_key: t.sessionKey,
            source_kind: t.sourceKind,
            source_name: t.sourceName,
            text: t.text,
            dedup_source_id: t.dedupSourceId,
            attachments: t.attachments ?? []
        },
        a = Date.now();
    return await Bt(o, s), await ps(e, "ingress_snapshot_ms", Date.now() - a, {
        eventId: n.id,
        sessionKey: t.sessionKey,
        sourceKind: t.sourceKind
    }), o
}
