// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: setSessionAliasAndReindex  (minified: avt, daemon.pretty.js:90965)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (high): `duoduo session alias <key> "<name>"` — give a session a human label so it is legible in `list`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function setSessionAliasAndReindex(paths, sessionIndex, params) {
    let trimmed = params.session_key.trim(),
        updatedMeta = await updateSessionDisplayName(paths, trimmed, params.display_name);
    if (!updatedMeta) return {
        ok: !1,
        reason: "not_found",
        session_key: trimmed
    };
    await refreshSessionIndexEntry(paths, sessionIndex, trimmed);
    let indexEntry = sessionIndex.get(trimmed);
    return {
        ok: !0,
        session_key: trimmed,
        display_name: hasNonEmptyDisplayName(indexEntry ?? updatedMeta) ? indexEntry?.display_name ?? updatedMeta.display_name ?? null : null
    }
}
