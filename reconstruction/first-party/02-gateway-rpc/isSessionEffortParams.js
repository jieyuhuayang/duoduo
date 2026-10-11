// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isSessionEffortParams  (minified: cR, daemon.pretty.js:31580)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): **Model and effort from the CLI.** `duoduo session model` / `duoduo session effort` inspect or set a channel session's model and reasoning effort without going through the chat
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSessionEffortParams(params) {
    return !isRecord(params) || typeof params.session_key != "string" || params.session_key.trim().length === 0 || Object.keys(params).some(key => key !== "session_key" && key !== "effort") ? !1 : Object.hasOwn(params, "effort") ? params.effort === null || typeof params.effort == "string" && isEffortLevel(params.effort) : !0
}
