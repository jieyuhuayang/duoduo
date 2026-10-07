// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: createVoidAwareAttachmentCallbacks  (minified: tde, daemon.pretty.js:36957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
