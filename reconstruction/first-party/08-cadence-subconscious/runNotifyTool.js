// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: runNotifyTool  (minified: gg, daemon.pretty.js:65226)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
        if (a >= M_e) throw new Error(`Notify depth limit exceeded (max ${M_e}). This notification chain is too deep — likely a loop.`);
        if (e.target_session_key?.trim() === i) throw new Error(`Cannot notify self (session_key=${i}). Notify must target a different session.`);
        let u = o ? o === "foreground" ? "channel" : o : W_e(i),
            l = (o ?? (u === "job" ? "job" : "meta")) === "job" && !e.target_session_key?.trim(),
            c = l ? "job-default-target" : "explicit-target",
            d = l ? await resolveJobOwnerNotifyTarget(n, i) : [await resolveNotifyTargetSessionKey(n, e.target_session_key)];
        if (d.filter(v => v === i).length > 0) throw new Error(`Cannot notify self (session_key=${i}). Notify must target a different session.`);
        let p = a + 1,
            m = e.correlation_id?.trim(),
            h = e.reply_to?.trim(),
            g = [];
        for (let [v, b] of d.entries()) try {
            let _ = "notify",
                I = {
                    notify_content: s,
                    text: s,
                    notify_source_kind: u,
                    notify_source_session_key: i,
                    notify_depth: p,
                    ...t.jobScheduleType ? {
                        notify_job_schedule_type: t.jobScheduleType
                    } : {},
                    ...m ? {
                        notify_correlation_id: m
                    } : {},
                    ...h ? {
                        notify_reply_to: h
                    } : {}
                },
                E = {
                    traceId: `notify_${Date.now().toString(36)}_${v}`,
                    routeId: _,
                    sourceName: "notify-tool",
                    sourceKind: "route",
                    sourceSessionKey: i,
                    targetSessionKey: b,
                    eventType: "notify"
                },
                R = await evaluateNotifyConsumerRefusal(n, b);
            if (R.refused) {
                let S = renderNotifyRefusalMessage(R.inputs, R.verdict, R.candidates, b, R.unconsumedHours),
                    D = await deliverRouteEventToSession(n, r, {
                        ...E,
                        walOnly: !0,
                        payload: {
                            ...I,
                            notify_refused_reason: S
                        }
                    });
                g.push({
                    targetSessionKey: b,
                    success: !1,
                    ...D.success ? {
                        refused: !0
                    } : {},
                    consumer: R.inputs,
                    error: D.success ? S : D.error
                });
                continue
            }
            let x = await deliverRouteEventToSession(n, r, {
                ...E,
                payload: I
            });
            g.push({
                targetSessionKey: b,
                success: x.success,
                eventId: x.eventId,
                mailboxPath: x.mailboxPath,
                consumer: R.inputs,
                error: x.error
            })
        } catch (_) {
            g.push({
                targetSessionKey: b,
                success: !1,
                error: _ instanceof Error ? _.message : String(_)
            })
        }
        if (g.filter(v => !v.success).length > 0) throw new Error(renderNotifyDeliveryReport(i, u, c, g));
        return renderNotifyDeliveryReport(i, u, c, g)
    } catch (n) {
        return Le("[Notify] Tool execution failed", n), `Error: ${n instanceof Error?n.message:String(n)}`
    }
}
