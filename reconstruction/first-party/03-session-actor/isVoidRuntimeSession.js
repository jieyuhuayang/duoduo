// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isVoidRuntimeSession  (minified: Gu, daemon.pretty.js:39034)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (medium): A new runtime value, `void`, for channel plugins whose sessions never run a model. A message to a void session is written to the spine and the outbox and wakes nothing.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isVoidRuntimeSession(paths, sessionKey, sourceChannelId) {
    let sessionChannelRuntime = await resolveSessionChannelRuntime(paths, sessionKey, sourceChannelId);
    return sessionChannelRuntime.ok && sessionChannelRuntime.runtime === "void"
}
