// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createVoidAwareAttachmentCallbacks  (minified: tde, daemon.pretty.js:36957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (medium): A new runtime value, `void`, for channel plugins whose sessions never run a model. A message to a void session is written to the spine and the outbox and wakes nothing.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createVoidAwareAttachmentCallbacks(e, t, n) {
    let r = Promise.resolve(),
        i = o => {
            r = r.then(o).catch(n)
        };
    return {
        onAttach: (o, s) => i(async () => {
            await isVoidRuntimeSession(e, o) || t.attachChannel(o, s)
        }),
        onDetach: (o, s) => i(async () => t.detachChannel(o, s))
    }
}
