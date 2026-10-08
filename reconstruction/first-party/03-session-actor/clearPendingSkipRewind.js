// duoduo reconstruction — subsystem: 03-session-actor
// symbol: clearPendingSkipRewind  (minified: Vmt, daemon.pretty.js:72090)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearPendingSkipRewind(e, t) {
    await clearSessionRuntimeStateField(e, t, "pending_skip_rewind")
}
