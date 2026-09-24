// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: deliverRouteEventToSession  (minified: Ps, daemon.pretty.js:64355)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function deliverRouteEventToSession(e, t, n) {
    let {
        traceId: r,
        routeId: i,
        sourceName: o,
        sourceKind: s,
        channelDescriptorId: a,
        targetSessionKey: u,
        sourceSessionKey: l,
        eventType: c,
        payload: d,
        preempt: f,
        walOnly: p,
        enqueueWithoutWake: m
    } = n;
    if (isSessionArchiving(u)) return Z("[route] delivery refused: session is being archived", {
        traceId: r,
        routeId: i,
        sourceSessionKey: l,
        sourceEventType: c,
        targetSessionKey: u
    }), {
        routeId: i,
        targetSessionKey: u,
        success: !1,
        error: "session_archiving"
    };
    if (isSessionArchived(e, u)) return Z("[route] delivery refused: session archived", {
        traceId: r,
        routeId: i,
        sourceSessionKey: l,
        sourceEventType: c,
        targetSessionKey: u
    }), {
        routeId: i,
        targetSessionKey: u,
        success: !1,
        error: "session_archived"
    };
    try {
        let h = createSpineEvent({
            type: "route.deliver",
            source: {
                kind: s ?? "route",
                name: o ?? i
            },
            session_key: u,
            payload: {
                route_id: i,
                source_session_key: l,
                source_event_type: c,
                channel_descriptor_id: a,
                payload: d
            }
        });
        if (await atomicAppendEvent(e, h), Re("[route] route event appended", {
                traceId: r,
                routeId: i,
                sourceSessionKey: l,
                targetSessionKey: u,
                sourceEventType: c,
                eventId: h.id
            }), p) return Re("[route] wal-only route event (no mailbox, no wake)", {
            traceId: r,
            routeId: i,
            sourceSessionKey: l,
            targetSessionKey: u,
            sourceEventType: c,
            eventId: h.id
        }), {
            routeId: i,
            targetSessionKey: u,
            success: !0,
            eventId: h.id
        };
        let g = await enqueueSessionInboxLine(e, u, `- [ ] @evt(${h.id})`);
        if (Re("[route] mailbox enqueued", {
                traceId: r,
                routeId: i,
                targetSessionKey: u,
                eventId: h.id,
                mailboxPath: g
            }), m) return Re("[route] enqueued without wake (waits for the owner's next turn)", {
            traceId: r,
            routeId: i,
            sourceSessionKey: l,
            sourceEventType: c,
            targetSessionKey: u,
            eventId: h.id,
            mailboxPath: g
        }), {
            routeId: i,
            targetSessionKey: u,
            success: !0,
            eventId: h.id,
            mailboxPath: g
        };
        let y = f ?? (c === "notify" || c === "job.complete" || c === "job.fail" ? "never" : "allow");
        return t.emit("session.wake", {
            sessionKey: u,
            preempt: y
        }), Re("[route] delivered to target inbox", {
            traceId: r,
            routeId: i,
            sourceSessionKey: l,
            sourceEventType: c,
            targetSessionKey: u,
            eventId: h.id,
            mailboxPath: g
        }), {
            routeId: i,
            targetSessionKey: u,
            success: !0,
            eventId: h.id,
            mailboxPath: g
        }
    } catch (h) {
        throw Z("[route] failed to enqueue to target inbox", {
            traceId: r,
            routeId: i,
            sourceSessionKey: l,
            sourceEventType: c,
            targetSessionKey: u,
            error: String(h)
        }), h
    }
}
