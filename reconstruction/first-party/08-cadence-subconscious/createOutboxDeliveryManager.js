// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createOutboxDeliveryManager  (minified: iSt, daemon.pretty.js:88396)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.1, v0.5.0, v0.5.6, v0.6.0, v0.8.0 (maps/history_daemon.json)
// locals: 28 renamed — 8 from the code at the binding (rule), 20 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createOutboxDeliveryManager(options) {
    let {
        paths,
        bus,
        subscriptions,
        maxAttempts = 5
    } = options, started = !1, inFlightIds = new Set, map = new Map;

    function deliverSerialized(record) {
        let sessionKey = record.session_key,
            deliveryPromise = (map.get(sessionKey) ?? Promise.resolve(!1)).then(() => deliverRecord(record)).catch(err => (logWarnMessage("[outbox-delivery] live delivery failed", {
                outboxId: record.id,
                sessionKey: record.session_key,
                error: err instanceof Error ? err.message : String(err)
            }), !1));
        return map.set(sessionKey, deliveryPromise), deliveryPromise.then(() => {
            map.get(sessionKey) === deliveryPromise && map.delete(sessionKey)
        }), deliveryPromise
    }
    let onSessionOutput = ({
            record
        }) => {
            deliverSerialized(record)
        },
        onCadenceTick = () => {
            flushPending().catch(err => {
                logWarnMessage("[outbox-delivery] pending flush failed", {
                    error: err instanceof Error ? err.message : String(err)
                })
            })
        };
    async function deliverRecord(record) {
        if (inFlightIds.has(record.id)) return !1;
        inFlightIds.add(record.id);
        try {
            if (record = await readOutboxRecord(paths, record.channel_kind, record.id) ?? record, record.status === "sent") return await recordOutboxSentId(paths, record.id), !0;
            if (await Yde(paths, record.id)) return await recordOutboxDeliveryAttempt(paths, record, {
                status: "sent"
            }), !0;
            if (isJobOrMetaOutboxRecord(record)) {
                let sentRecord = await recordOutboxDeliveryAttempt(paths, record, {
                    status: "sent"
                });
                return await recordOutboxSentId(paths, sentRecord.id), !0
            }
            if (subscriptions.getSubscribers(record.session_key).length === 0) return !1;
            if (subscriptions.publishOutput(record.session_key, record) === 0) return record.attempts >= maxAttempts || await recordOutboxDeliveryAttempt(paths, record, {
                status: "failed",
                error: "delivery failed"
            }), !1;
            let sentRecord = await recordOutboxDeliveryAttempt(paths, record, {
                status: "sent"
            });
            return await recordOutboxSentId(paths, sentRecord.id), logLatencyStageTelemetry("delivered", sentRecord.id, {
                outboxId: sentRecord.id,
                sessionKey: sentRecord.session_key
            }), !0
        } finally {
            inFlightIds.delete(record.id)
        }
    }
    let pendingFlushes = new Set;

    function flushPending() {
        let flushPromise = flushRetryableRecords();
        return pendingFlushes.add(flushPromise), flushPromise.then(() => pendingFlushes.delete(flushPromise), () => pendingFlushes.delete(flushPromise)), flushPromise
    }
    async function flushRetryableRecords() {
        let retryableOutboxRecords = await listRetryableOutboxRecords(paths, maxAttempts),
            deliveredCount = 0;
        for (let record of retryableOutboxRecords) await deliverSerialized(record) && (deliveredCount += 1);
        return deliveredCount
    }
    return {
        start() {
            started || (started = !0, bus.on("session.output", onSessionOutput), bus.on("cadence.tick", onCadenceTick))
        },
        async stop() {
            started && (started = !1, bus.off("session.output", onSessionOutput), bus.off("cadence.tick", onCadenceTick), await Promise.allSettled([...pendingFlushes, ...map.values()]))
        },
        flushPending
    }
}
