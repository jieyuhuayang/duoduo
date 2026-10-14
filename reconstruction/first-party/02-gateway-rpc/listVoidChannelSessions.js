// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listVoidChannelSessions  (minified: rde, daemon.pretty.js:36969)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): `spine.cat` takes `redact: "external"` for readers outside duoduo.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listVoidChannelSessions(paths) {
    let allSessionStateFiles = await readAllSessionStateFiles(paths),
        map = new Map,
        voidSessionKeys = new Set;
    for (let [sessionKey, sessionState] of Object.entries(allSessionStateFiles)) {
        let sourceChannelId = sessionState.source_channel_id;
        if (!sourceChannelId || classifySessionKeyKind(sessionKey) !== "channel") continue;
        let isVoidPromise = map.get(sourceChannelId);
        isVoidPromise === void 0 && (isVoidPromise = isVoidRuntimeSession(paths, sessionKey, sourceChannelId), map.set(sourceChannelId, isVoidPromise)), await isVoidPromise && voidSessionKeys.add(sessionKey)
    }
    return voidSessionKeys
}
