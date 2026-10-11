// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readOrSetSessionEffort  (minified: lvt, daemon.pretty.js:91257)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 2 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): **Model and effort from the CLI.** `duoduo session model` / `duoduo session effort` inspect or set a channel session's model and reasoning effort without going through the chat
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readOrSetSessionEffort(sessionIndex, effortControl, params) {
    let trimmed = params.session_key.trim(),
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
    return sessionKind !== "channel" ? {
        ok: !1,
        reason: "forbidden_kind",
        target: trimmed,
        session_key: sessionByKeyOrAlias.session_key,
        kind: sessionKind
    } : isSessionArchiving(sessionByKeyOrAlias.session_key) ? {
        ok: !1,
        reason: "archiving",
        target: trimmed,
        session_key: sessionByKeyOrAlias.session_key
    } : {
        ...Object.hasOwn(params, "effort") ? await effortControl.setSessionEffort(sessionByKeyOrAlias.session_key, params.effort ?? null) : await effortControl.getSessionEffort(sessionByKeyOrAlias.session_key),
        session_key: sessionByKeyOrAlias.session_key
    }
}
