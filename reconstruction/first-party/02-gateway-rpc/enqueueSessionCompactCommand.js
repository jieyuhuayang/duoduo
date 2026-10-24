// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: enqueueSessionCompactCommand  (minified: cxt, daemon.pretty.js:93415)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.8 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.8 (high): `duoduo session compact` — compact a channel session's context on demand. Queue a `/compact` for any channel session by key or name; it runs on that session's next turn ... Channel sessions only.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function enqueueSessionCompactCommand(paths, bus, sessionIndex, gatewayCommands, params) {
    let trimmed = params.target.trim(),
        sessionByKeyOrAlias = resolveSessionByKeyOrAlias(sessionIndex, trimmed);
    if (!sessionByKeyOrAlias.ok) return sessionByKeyOrAlias.reason === "ambiguous" ? {
        ok: !1,
        reason: "ambiguous",
        target: trimmed,
        candidates: sessionByKeyOrAlias.candidates
    } : {
        ok: !1,
        reason: "not_found",
        target: trimmed
    };
    let sessionKind = classifySessionKeyKind(sessionByKeyOrAlias.session_key);
    if (sessionKind !== "channel") return {
        ok: !1,
        reason: "forbidden_kind",
        target: trimmed,
        session_key: sessionByKeyOrAlias.session_key,
        kind: sessionKind
    };
    if (await isVoidRuntimeSession(paths, sessionByKeyOrAlias.session_key)) return {
        ok: !1,
        reason: "void_session",
        target: trimmed,
        session_key: sessionByKeyOrAlias.session_key,
        error: `${Ju} It has no context to compact; nothing was queued.`
    };
    if (isSessionArchiving(sessionByKeyOrAlias.session_key)) return {
        ok: !1,
        reason: "archiving",
        target: trimmed,
        session_key: sessionByKeyOrAlias.session_key
    };
    let ingestResult = await ingestChannelCommand(paths, {
        sessionKey: sessionByKeyOrAlias.session_key,
        sourceKind: "rpc",
        sourceName: params.source?.trim() || "session.compact",
        command: "/compact"
    }, {
        bus,
        gatewayCommands
    });
    return ingestResult.routing.enqueued ? (bus.emit("session.wake", {
        sessionKey: sessionByKeyOrAlias.session_key,
        preempt: resolvePreemptFromCommandText("/compact")
    }), {
        ok: !0,
        target: trimmed,
        session_key: sessionByKeyOrAlias.session_key,
        display_name: sessionByKeyOrAlias.display_name ?? null,
        event_id: ingestResult.event.id
    }) : {
        ok: !1,
        reason: "delivery_failed",
        target: trimmed,
        session_key: sessionByKeyOrAlias.session_key,
        error: "command was not enqueued (gateway did not route /compact to the session mailbox)"
    }
}
