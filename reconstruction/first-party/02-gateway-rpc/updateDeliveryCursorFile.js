// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: updateDeliveryCursorFile  (minified: $we, daemon.pretty.js:66481)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateDeliveryCursorFile(paths, sessionKey, consumerId, update) {
    let deliveryCursorPath = resolveDeliveryCursorPath(paths, sessionKey, consumerId);
    return runWithSessionMutex(sessionKey, async () => {
        if (isSessionArchived(paths, sessionKey)) return logDebugMessage("[delivery-cursor] skip cursor write: session archived (tombstoned)", {
            sessionKey
        }), !1;
        let nextCursor = update(await readDeliveryCursorFile(paths, sessionKey, consumerId));
        return nextCursor ? (await ensureDirectoryExists(Pwe.dirname(deliveryCursorPath)), await writeJsonFileAtomic(deliveryCursorPath, nextCursor), !0) : !1
    })
}
