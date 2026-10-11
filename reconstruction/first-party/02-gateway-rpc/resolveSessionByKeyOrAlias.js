// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveSessionByKeyOrAlias  (minified: fp, daemon.pretty.js:90948)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.4 (high): `duoduo session notify <target> -m "<msg>"` — wake another session by key or alias
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionByKeyOrAlias(sessionIndex, keyOrAlias) {
    let exactEntry = sessionIndex.get(keyOrAlias);
    if (exactEntry) return {
        ok: !0,
        session_key: exactEntry.session_key,
        display_name: hasNonEmptyDisplayName(exactEntry) ? exactEntry.display_name ?? null : null
    };
    let candidates = sessionIndex.list().filter(entry => entry.display_name === keyOrAlias).map(match => ({
        session_key: match.session_key,
        display_name: hasNonEmptyDisplayName(match) ? match.display_name ?? null : null
    }));
    return candidates.length === 1 ? {
        ok: !0,
        session_key: candidates[0].session_key,
        display_name: candidates[0].display_name ?? null
    } : candidates.length > 1 ? {
        ok: !1,
        reason: "ambiguous",
        candidates
    } : {
        ok: !1,
        reason: "not_found"
    }
}
