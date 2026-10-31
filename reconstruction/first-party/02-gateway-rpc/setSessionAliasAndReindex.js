// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: setSessionAliasAndReindex  (minified: qO, daemon.pretty.js:90254)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (high): `duoduo session alias <key> "<name>"` — give a session a human label so it is legible in `list`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function setSessionAliasAndReindex(ctx, sessionKey, displayName, mainAuthorized) {
    let updated = await updateSessionDisplayName(ctx.paths, sessionKey, displayName, {
        mainAuthorized
    });
    if (!updated) return {
        ok: !1,
        reason: "not_found",
        session_key: sessionKey
    };
    await refreshSessionIndexEntry(ctx.paths, ctx.sessionIndex, sessionKey);
    let indexEntry = ctx.sessionIndex.get(sessionKey);
    return {
        ok: !0,
        session_key: sessionKey,
        display_name: hasNonEmptyDisplayName(indexEntry ?? updated) ? indexEntry?.display_name ?? updated.display_name ?? null : null
    }
}
