// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: enqueueSessionCompactCommand  (minified: Ryt, daemon.pretty.js:89767)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function enqueueSessionCompactCommand(e, t, n, r, i) {
    let o = i.target.trim(),
        s = resolveSessionByKeyOrAlias(n, o);
    if (!s.ok) return s.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: o,
        candidates: s.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: o
    };
    let a = classifySessionKeyKind(s.session_key);
    if (a !== "channel") return {
        ok: !1,
        reason: "forbidden_kind",
        target: o,
        session_key: s.session_key,
        kind: a
    };
    if (isSessionArchiving(s.session_key)) return {
        ok: !1,
        reason: "archiving",
        target: o,
        session_key: s.session_key
    };
    let u = await ingestChannelCommand(e, {
        sessionKey: s.session_key,
        sourceKind: "rpc",
        sourceName: i.source?.trim() || "session.compact",
        command: "/compact"
    }, {
        bus: t,
        gatewayCommands: r
    });
    return u.routing.enqueued ? (t.emit("session.wake", {
        sessionKey: s.session_key,
        preempt: resolvePreemptFromCommandText("/compact")
    }), {
        ok: !0,
        target: o,
        session_key: s.session_key,
        display_name: s.display_name ?? null,
        event_id: u.event.id
    }) : {
        ok: !1,
        reason: "delivery_failed",
        target: o,
        session_key: s.session_key,
        error: "command was not enqueued (gateway did not route /compact to the session mailbox)"
    }
}
