// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: writeIngressSnapshot  (minified: zet, daemon.pretty.js:88165)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0 (maps/history_daemon.json)
// locals: 8 renamed — 1 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function writeIngressSnapshot(paths, ingress, event) {
    let sessionKeyHash = hashSessionKey(ingress.sessionKey),
        snapshotDir = mf.join(paths.varIngressDir, sessionKeyHash),
        snapshotPath = mf.join(snapshotDir, `${event.id}.json`),
        snapshot = ingress.rawPayload ?? {
            session_key: ingress.sessionKey,
            source_kind: ingress.sourceKind,
            source_name: ingress.sourceName,
            text: ingress.text,
            dedup_source_id: ingress.dedupSourceId,
            attachments: ingress.attachments ?? []
        },
        now = Date.now();
    return await writeJsonFileAtomic(snapshotPath, snapshot), await recordTelemetryMetric(paths, "ingress_snapshot_ms", Date.now() - now, {
        eventId: event.id,
        sessionKey: ingress.sessionKey,
        sourceKind: ingress.sourceKind
    }), snapshotPath
}
