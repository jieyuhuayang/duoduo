// duoduo reconstruction — subsystem: 03-session-actor
// symbol: setPendingInterruptedContext  (minified: qmt, daemon.pretty.js:72081)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function setPendingInterruptedContext(e, t, n) {
    await patchSessionRuntimeState(e, t, {
        pending_interrupted_context: n,
        updated_at: new Date().toISOString()
    })
}
