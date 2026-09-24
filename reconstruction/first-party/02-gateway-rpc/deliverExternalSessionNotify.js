// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: deliverExternalSessionNotify  (minified: A0e, daemon.pretty.js:89595)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverExternalSessionNotify(e, t, n, r) {
    let i = r.target.trim(),
        o = resolveSessionByKeyOrAlias(n, i);
    if (!o.ok) return o.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: i,
        candidates: o.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: i
    };
    let s = resolveIsolatedPlaneKind(o.session_key);
    if (s) return {
        ok: !1,
        reason: "forbidden_kind",
        target: i,
        session_key: o.session_key,
        kind: s
    };
    let a = r.source?.trim() || "session.notify",
        u = `session-notify-${qS.randomUUID()}`,
        l = {
            notify_content: r.message,
            text: r.message,
            notify_source_kind: "external",
            notify_source_label: a,
            notify_source: a
        },
        c = {
            traceId: u,
            routeId: u,
            sourceName: a,
            sourceKind: "route",
            targetSessionKey: o.session_key,
            sourceSessionKey: "external:session.notify",
            eventType: "external.notify",
            preempt: "never"
        };
    if (!r.force) {
        let f = await evaluateNotifyConsumerRefusal(e, o.session_key);
        if (f.refused) {
            let p = renderNotifyRefusalMessage(f.inputs, f.verdict, f.candidates, o.session_key, f.unconsumedHours),
                m = await deliverRouteEventToSession(e, t, {
                    ...c,
                    walOnly: !0,
                    payload: {
                        ...l,
                        notify_refused_reason: p
                    }
                });
            return m.success ? {
                ok: !1,
                reason: "no_consumer",
                target: i,
                session_key: o.session_key,
                error: p
            } : {
                ok: !1,
                reason: "delivery_failed",
                target: i,
                session_key: o.session_key,
                error: m.error
            }
        }
    }
    let d = await deliverRouteEventToSession(e, t, {
        ...c,
        payload: l
    });
    return d.success ? {
        ok: !0,
        target: i,
        session_key: o.session_key,
        display_name: o.display_name ?? null,
        route_id: u,
        event_id: d.eventId,
        mailbox_path: d.mailboxPath
    } : {
        ok: !1,
        reason: "delivery_failed",
        target: i,
        session_key: o.session_key,
        error: d.error
    }
}
