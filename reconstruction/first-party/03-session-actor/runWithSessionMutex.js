// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runWithSessionMutex  (minified: Wi, daemon.pretty.js:34595)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 1 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): All session-dir writers consolidated on one per-session mutex: `ensureSessionDescriptor`, `writeSessionMeta`, `updateSessionRuntimeState`, and `enqueueMailboxItem` now take the same lock that `archiveSessionDir` takes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runWithSessionMutex(sessionKey, task) {
    let releaseLock, promise = new Promise(resolve => {
            releaseLock = resolve
        }),
        previousLock = rI.get(sessionKey) ?? Promise.resolve();
    rI.set(sessionKey, promise), await previousLock;
    try {
        return await task()
    } finally {
        releaseLock(), rI.get(sessionKey) === promise && rI.delete(sessionKey)
    }
}
