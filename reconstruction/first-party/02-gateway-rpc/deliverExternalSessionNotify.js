// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: deliverExternalSessionNotify  (minified: EIe, daemon.pretty.js:91037)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.8.2, v0.8.4 (maps/history_daemon.json)
// changelog v0.5.4 (high): `duoduo session notify <target> -m "<msg>"` — wake another session by key or alias with a source-tagged notification (for cross-session orchestration). Only foreground/job sessions are valid targets; the kernel/subconscious plane is isolated and refused.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverExternalSessionNotify(e, t, n, r) {
    let i = r.target.trim(),
        o = r.exact_key ? resolveSessionByExactKey(n, i) : resolveSessionByKeyOrAlias(n, i);
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
    let a = r.idempotency_key?.trim(),
        u = a === void 0 ? null : `session.notify:${JSON.stringify(a)}`,
        l = u === null ? null : await loadRegistryDedupStore(e);
    if (u !== null && l !== null) {
        let b = l.get(u),
            _ = b?.event_id ? await readEventById(e, b.event_id, {
                notAfter: b.ts
            }) : null;
        if (_) return replayIdempotentSessionNotify(_, {
            target: i,
            sessionKey: o.session_key,
            message: r.message,
            idempotencyKey: a
        })
    }
    let c = async (b, _) => {
        u === null || l === null || !b || !_ || await l.record({
            key: u,
            ts: _,
            event_id: b
        })
    }, d = r.caller_session?.trim(), f = d !== void 0 && d !== o.session_key ? d : null;
    if (f !== null && !n.get(f)) return {
        ok: !1,
        reason: "unknown_caller",
        target: i,
        caller_session: f,
        error: `The calling session ${f} (ALADUO_CALLER_SESSION) does not exist, so nothing was sent. If this shell outlived its session, unset ALADUO_CALLER_SESSION and send again; the message then goes out under the --source label.`
    };
    let p = r.source?.trim() || "session.notify",
        m = `session-notify-${AN.randomUUID()}`,
        h = {
            notify_content: r.message,
            text: r.message,
            ...r.in_reply_to !== void 0 ? {
                notify_in_reply_to: r.in_reply_to.trim()
            } : {},
            ...a !== void 0 ? {
                idempotency_key: a
            } : {}
        },
        g = f === null ? {
            ...h,
            notify_source_kind: "external",
            notify_source_label: p,
            notify_source: p
        } : {
            ...h,
            notify_source_kind: classifySessionKeyKind(f),
            notify_source_session_key: f
        },
        y = {
            traceId: m,
            routeId: m,
            sourceKind: "route",
            targetSessionKey: o.session_key,
            preempt: "never",
            ...f === null ? {
                sourceName: p,
                sourceSessionKey: "external:session.notify",
                eventType: dW
            } : {
                sourceName: "notify-tool",
                sourceSessionKey: f,
                eventType: "notify"
            }
        };
    if (!r.force) {
        let b = await evaluateNotifyConsumerRefusal(e, o.session_key);
        if (b.refused) {
            let _ = renderNotifyRefusalMessage(b.inputs, b.verdict, b.candidates, o.session_key, b.unconsumedHours),
                E = await deliverRouteEventToSession(e, t, {
                    ...y,
                    walOnly: !0,
                    payload: {
                        ...g,
                        notify_refused_reason: _
                    }
                });
            return E.success ? (await c(E.eventId, E.eventTs), {
                ok: !1,
                reason: "no_consumer",
                target: i,
                session_key: o.session_key,
                error: _
            }) : {
                ok: !1,
                reason: "delivery_failed",
                target: i,
                session_key: o.session_key,
                error: E.error
            }
        }
    }
    let v = await deliverRouteEventToSession(e, t, {
        ...y,
        payload: g
    });
    return v.success ? (await c(v.eventId, v.eventTs), {
        ok: !0,
        target: i,
        session_key: o.session_key,
        display_name: o.display_name ?? null,
        route_id: m,
        event_id: v.eventId,
        ...v.eventTs !== void 0 ? {
            ts: v.eventTs
        } : {},
        mailbox_path: v.mailboxPath,
        duplicate: !1
    }) : {
        ok: !1,
        reason: "delivery_failed",
        target: i,
        session_key: o.session_key,
        error: v.error
    }
}
