// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runWithSessionMutex  (minified: Vi, daemon.pretty.js:32513)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (high): All session-dir writers consolidated on one per-session mutex: `ensureSessionDescriptor`, `writeSessionMeta`, `updateSessionRuntimeState`, and `enqueueMailboxItem` now take the same lock that `archiveSessionDir` takes.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runWithSessionMutex(e, t) {
    let n, r = new Promise(o => {
            n = o
        }),
        i = UR.get(e) ?? Promise.resolve();
    UR.set(e, r), await i;
    try {
        return await t()
    } finally {
        n(), UR.get(e) === r && UR.delete(e)
    }
}
