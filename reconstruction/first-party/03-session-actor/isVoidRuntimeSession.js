// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isVoidRuntimeSession  (minified: Gu, daemon.pretty.js:36952)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.4 (medium): A new runtime value, `void`, for channel plugins whose sessions never run a model. A message to a void session is written to the spine and the outbox and wakes nothing.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isVoidRuntimeSession(e, t, n) {
    let r = await resolveSessionChannelRuntime(e, t, n);
    return r.ok && r.runtime === "void"
}
