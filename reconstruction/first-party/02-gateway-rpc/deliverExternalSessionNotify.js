// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: deliverExternalSessionNotify  (minified: EIe, daemon.pretty.js:91037)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.2, v0.8.4 (maps/history_daemon.json)
// locals: 26 renamed — 3 from the code at the binding (rule), 23 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (high): `duoduo session notify <target> -m "<msg>"` — wake another session by key or alias with a source-tagged notification (for cross-session orchestration). Only foreground/job sessions are valid targets; the kernel/subconscious plane is isolated and refused.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverExternalSessionNotify(paths, bus, sessionIndex, params) {
    let trimmed = params.target.trim(),
        resolved = params.exact_key ? resolveSessionByExactKey(sessionIndex, trimmed) : resolveSessionByKeyOrAlias(sessionIndex, trimmed);
    if (!resolved.ok) return resolved.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: trimmed,
        candidates: resolved.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: trimmed
    };
    let isolatedPlaneKind = resolveIsolatedPlaneKind(resolved.session_key);
    if (isolatedPlaneKind) return {
        ok: !1,
        reason: "forbidden_kind",
        target: trimmed,
        session_key: resolved.session_key,
        kind: isolatedPlaneKind
    };
    let idempotencyKey = params.idempotency_key?.trim(),
        dedupKey = idempotencyKey === void 0 ? null : `session.notify:${JSON.stringify(idempotencyKey)}`,
        dedupStore = dedupKey === null ? null : await loadRegistryDedupStore(paths);
    if (dedupKey !== null && dedupStore !== null) {
        let dedupEntry = dedupStore.get(dedupKey),
            priorEvent = dedupEntry?.event_id ? await readEventById(paths, dedupEntry.event_id, {
                notAfter: dedupEntry.ts
            }) : null;
        if (priorEvent) return replayIdempotentSessionNotify(priorEvent, {
            target: trimmed,
            sessionKey: resolved.session_key,
            message: params.message,
            idempotencyKey
        })
    }
    let recordDedup = async (eventId, eventTs) => {
        dedupKey === null || dedupStore === null || !eventId || !eventTs || await dedupStore.record({
            key: dedupKey,
            ts: eventTs,
            event_id: eventId
        })
    }, callerSession = params.caller_session?.trim(), callerSessionKey = callerSession !== void 0 && callerSession !== resolved.session_key ? callerSession : null;
    if (callerSessionKey !== null && !sessionIndex.get(callerSessionKey)) return {
        ok: !1,
        reason: "unknown_caller",
        target: trimmed,
        caller_session: callerSessionKey,
        error: `The calling session ${callerSessionKey} (ALADUO_CALLER_SESSION) does not exist, so nothing was sent. If this shell outlived its session, unset ALADUO_CALLER_SESSION and send again; the message then goes out under the --source label.`
    };
    let sourceLabel = params.source?.trim() || "session.notify",
        routeId = `session-notify-${AN.randomUUID()}`,
        basePayload = {
            notify_content: params.message,
            text: params.message,
            ...params.in_reply_to !== void 0 ? {
                notify_in_reply_to: params.in_reply_to.trim()
            } : {},
            ...idempotencyKey !== void 0 ? {
                idempotency_key: idempotencyKey
            } : {}
        },
        payload = callerSessionKey === null ? {
            ...basePayload,
            notify_source_kind: "external",
            notify_source_label: sourceLabel,
            notify_source: sourceLabel
        } : {
            ...basePayload,
            notify_source_kind: classifySessionKeyKind(callerSessionKey),
            notify_source_session_key: callerSessionKey
        },
        routeParams = {
            traceId: routeId,
            routeId,
            sourceKind: "route",
            targetSessionKey: resolved.session_key,
            preempt: "never",
            ...callerSessionKey === null ? {
                sourceName: sourceLabel,
                sourceSessionKey: "external:session.notify",
                eventType: dW
            } : {
                sourceName: "notify-tool",
                sourceSessionKey: callerSessionKey,
                eventType: "notify"
            }
        };
    if (!params.force) {
        let refusal = await evaluateNotifyConsumerRefusal(paths, resolved.session_key);
        if (refusal.refused) {
            let notifyRefusalMessage = renderNotifyRefusalMessage(refusal.inputs, refusal.verdict, refusal.candidates, resolved.session_key, refusal.unconsumedHours),
                refusedDelivery = await deliverRouteEventToSession(paths, bus, {
                    ...routeParams,
                    walOnly: !0,
                    payload: {
                        ...payload,
                        notify_refused_reason: notifyRefusalMessage
                    }
                });
            return refusedDelivery.success ? (await recordDedup(refusedDelivery.eventId, refusedDelivery.eventTs), {
                ok: !1,
                reason: "no_consumer",
                target: trimmed,
                session_key: resolved.session_key,
                error: notifyRefusalMessage
            }) : {
                ok: !1,
                reason: "delivery_failed",
                target: trimmed,
                session_key: resolved.session_key,
                error: refusedDelivery.error
            }
        }
    }
    let delivery = await deliverRouteEventToSession(paths, bus, {
        ...routeParams,
        payload
    });
    return delivery.success ? (await recordDedup(delivery.eventId, delivery.eventTs), {
        ok: !0,
        target: trimmed,
        session_key: resolved.session_key,
        display_name: resolved.display_name ?? null,
        route_id: routeId,
        event_id: delivery.eventId,
        ...delivery.eventTs !== void 0 ? {
            ts: delivery.eventTs
        } : {},
        mailbox_path: delivery.mailboxPath,
        duplicate: !1
    }) : {
        ok: !1,
        reason: "delivery_failed",
        target: trimmed,
        session_key: resolved.session_key,
        error: delivery.error
    }
}
