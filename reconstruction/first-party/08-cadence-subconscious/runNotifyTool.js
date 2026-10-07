// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runNotifyTool  (minified: Lg, daemon.pretty.js:65484)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0, v0.5.1, v0.8.0, v0.8.2, v0.8.4 (maps/history_daemon.json)
// changelog v0.5.1 (high): adds `correlation_id` / `reply_to` fields to the Notify MCP tool
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runNotifyTool(e, t) {
    try {
        let {
            paths: n,
            bus: r,
            sessionKey: i,
            sessionContextKind: o
        } = t;
        if (!r) throw new Error("Notify is unavailable: runtime bus is not available in this context.");
        if (!i || i.trim().length === 0) throw new Error("Notify requires a current session context (session_key).");
        let s = e.notify_content?.trim();
        if (!s) throw new Error("notify_content is required and must not be empty.");
        let a = t.notifyDepth ?? 0;
        if (a >= eve) throw new Error(`Notify depth limit exceeded (max ${eve}). This notification chain is too deep — likely a loop.`);
        if (e.target_session_key?.trim() === i) throw new Error(`Cannot notify self (session_key=${i}). Notify must target a different session.`);
        let u = o ? o === "foreground" ? "channel" : o : cve(i),
            l = e.in_reply_to?.trim() || void 0,
            c = (o ?? (u === "job" ? "job" : "meta")) === "job" && !e.target_session_key?.trim(),
            d = c ? "job-default-target" : "explicit-target",
            f = c ? await resolveJobOwnerNotifyTarget(n, i) : [await resolveNotifyTargetSessionKey(n, e.target_session_key)];
        if (f.filter(b => b === i).length > 0) throw new Error(`Cannot notify self (session_key=${i}). Notify must target a different session.`);
        let m = a + 1,
            h = e.correlation_id?.trim(),
            g = e.reply_to?.trim(),
            y = [];
        for (let [b, _] of f.entries()) try {
            let E = "notify",
                R = {
                    notify_content: s,
                    text: s,
                    notify_source_kind: u,
                    notify_source_session_key: i,
                    notify_depth: m,
                    ...t.jobScheduleType ? {
                        notify_job_schedule_type: t.jobScheduleType
                    } : {},
                    ...h ? {
                        notify_correlation_id: h
                    } : {},
                    ...g ? {
                        notify_reply_to: g
                    } : {},
                    ...l ? {
                        notify_in_reply_to: l
                    } : {}
                },
                P = {
                    traceId: `notify_${Date.now().toString(36)}_${b}`,
                    routeId: E,
                    sourceName: "notify-tool",
                    sourceKind: "route",
                    sourceSessionKey: i,
                    targetSessionKey: _,
                    eventType: "notify"
                },
                k = await evaluateNotifyConsumerRefusal(n, _);
            if (k.refused) {
                let D = renderNotifyRefusalMessage(k.inputs, k.verdict, k.candidates, _, k.unconsumedHours),
                    A = await deliverRouteEventToSession(n, r, {
                        ...P,
                        walOnly: !0,
                        payload: {
                            ...R,
                            notify_refused_reason: D
                        }
                    });
                y.push({
                    targetSessionKey: _,
                    success: !1,
                    ...A.success ? {
                        refused: !0
                    } : {},
                    consumer: k.inputs,
                    error: A.success ? D : A.error
                });
                continue
            }
            let S = await deliverRouteEventToSession(n, r, {
                ...P,
                payload: R
            });
            y.push({
                targetSessionKey: _,
                success: S.success,
                eventId: S.eventId,
                mailboxPath: S.mailboxPath,
                consumer: k.inputs,
                error: S.error
            })
        } catch (E) {
            y.push({
                targetSessionKey: _,
                success: !1,
                error: E instanceof Error ? E.message : String(E)
            })
        }
        if (y.filter(b => !b.success).length > 0) throw new Error(renderNotifyDeliveryReport(i, u, d, y));
        return renderNotifyDeliveryReport(i, u, d, y)
    } catch (n) {
        return logErrorMessage("[Notify] Tool execution failed", n), `Error: ${n instanceof Error?n.message:String(n)}`
    }
}
