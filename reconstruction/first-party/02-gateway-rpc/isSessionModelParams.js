// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionModelParams  (minified: lR, daemon.pretty.js:31576)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (high): **Model and effort from the CLI.** `duoduo session model` / `duoduo session effort` inspect or set a channel session's model and reasoning effort without going through the chat
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionModelParams(e) {
    return !isRecord(e) || typeof e.session_key != "string" || e.session_key.trim().length === 0 || Object.keys(e).some(t => t !== "session_key" && t !== "model") ? !1 : Object.hasOwn(e, "model") ? e.model === null || typeof e.model == "string" && e.model.length > 0 && !/\s/.test(e.model) : !0
}
