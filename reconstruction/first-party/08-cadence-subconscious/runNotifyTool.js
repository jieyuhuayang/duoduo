// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runNotifyTool  (minified: Lg, daemon.pretty.js:65484)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.5.1, v0.8.0, v0.8.2, v0.8.4 (maps/history_daemon.json)
// locals: 30 renamed — 7 from the code at the binding (rule), 23 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.1 (high): adds `correlation_id` / `reply_to` fields to the Notify MCP tool
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runNotifyTool(input, ctx) {
    try {
        let {
            paths,
            bus,
            sessionKey,
            sessionContextKind
        } = ctx;
        if (!bus) throw new Error("Notify is unavailable: runtime bus is not available in this context.");
        if (!sessionKey || sessionKey.trim().length === 0) throw new Error("Notify requires a current session context (session_key).");
        let notifyContent = input.notify_content?.trim();
        if (!notifyContent) throw new Error("notify_content is required and must not be empty.");
        let notifyDepth = ctx.notifyDepth ?? 0;
        if (notifyDepth >= eve) throw new Error(`Notify depth limit exceeded (max ${eve}). This notification chain is too deep — likely a loop.`);
        if (input.target_session_key?.trim() === sessionKey) throw new Error(`Cannot notify self (session_key=${sessionKey}). Notify must target a different session.`);
        let sourceKind = sessionContextKind ? sessionContextKind === "foreground" ? "channel" : sessionContextKind : cve(sessionKey),
            inReplyTo = input.in_reply_to?.trim() || void 0,
            useJobDefaultTarget = (sessionContextKind ?? (sourceKind === "job" ? "job" : "meta")) === "job" && !input.target_session_key?.trim(),
            mode = useJobDefaultTarget ? "job-default-target" : "explicit-target",
            targetSessionKeys = useJobDefaultTarget ? await resolveJobOwnerNotifyTarget(paths, sessionKey) : [await resolveNotifyTargetSessionKey(paths, input.target_session_key)];
        if (targetSessionKeys.filter(targetKey => targetKey === sessionKey).length > 0) throw new Error(`Cannot notify self (session_key=${sessionKey}). Notify must target a different session.`);
        let nextDepth = notifyDepth + 1,
            correlationId = input.correlation_id?.trim(),
            replyTo = input.reply_to?.trim(),
            results = [];
        for (let [index, targetSessionKey] of targetSessionKeys.entries()) try {
            let routeId = "notify",
                payload = {
                    notify_content: notifyContent,
                    text: notifyContent,
                    notify_source_kind: sourceKind,
                    notify_source_session_key: sessionKey,
                    notify_depth: nextDepth,
                    ...ctx.jobScheduleType ? {
                        notify_job_schedule_type: ctx.jobScheduleType
                    } : {},
                    ...correlationId ? {
                        notify_correlation_id: correlationId
                    } : {},
                    ...replyTo ? {
                        notify_reply_to: replyTo
                    } : {},
                    ...inReplyTo ? {
                        notify_in_reply_to: inReplyTo
                    } : {}
                },
                routeEvent = {
                    traceId: `notify_${Date.now().toString(36)}_${index}`,
                    routeId,
                    sourceName: "notify-tool",
                    sourceKind: "route",
                    sourceSessionKey: sessionKey,
                    targetSessionKey,
                    eventType: "notify"
                },
                refusal = await evaluateNotifyConsumerRefusal(paths, targetSessionKey);
            if (refusal.refused) {
                let notifyRefusalMessage = renderNotifyRefusalMessage(refusal.inputs, refusal.verdict, refusal.candidates, targetSessionKey, refusal.unconsumedHours),
                    walResult = await deliverRouteEventToSession(paths, bus, {
                        ...routeEvent,
                        walOnly: !0,
                        payload: {
                            ...payload,
                            notify_refused_reason: notifyRefusalMessage
                        }
                    });
                results.push({
                    targetSessionKey,
                    success: !1,
                    ...walResult.success ? {
                        refused: !0
                    } : {},
                    consumer: refusal.inputs,
                    error: walResult.success ? notifyRefusalMessage : walResult.error
                });
                continue
            }
            let deliveryResult = await deliverRouteEventToSession(paths, bus, {
                ...routeEvent,
                payload
            });
            results.push({
                targetSessionKey,
                success: deliveryResult.success,
                eventId: deliveryResult.eventId,
                mailboxPath: deliveryResult.mailboxPath,
                consumer: refusal.inputs,
                error: deliveryResult.error
            })
        } catch (err) {
            results.push({
                targetSessionKey,
                success: !1,
                error: err instanceof Error ? err.message : String(err)
            })
        }
        if (results.filter(result => !result.success).length > 0) throw new Error(renderNotifyDeliveryReport(sessionKey, sourceKind, mode, results));
        return renderNotifyDeliveryReport(sessionKey, sourceKind, mode, results)
    } catch (err) {
        return logErrorMessage("[Notify] Tool execution failed", err), `Error: ${err instanceof Error?err.message:String(err)}`
    }
}
