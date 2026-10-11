// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createVoidAwareAttachmentCallbacks  (minified: tde, daemon.pretty.js:36957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 0 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): A new runtime value, `void`, for channel plugins whose sessions never run a model. A message to a void session is written to the spine and the outbox and wakes nothing.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createVoidAwareAttachmentCallbacks(paths, sessionManager, onError) {
    let queue = Promise.resolve(),
        enqueue = task => {
            queue = queue.then(task).catch(onError)
        };
    return {
        onAttach: (sessionKey, channel) => enqueue(async () => {
            await isVoidRuntimeSession(paths, sessionKey) || sessionManager.attachChannel(sessionKey, channel)
        }),
        onDetach: (sessionKey, channel) => enqueue(async () => sessionManager.detachChannel(sessionKey, channel))
    }
}
