// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelSpawnParams  (minified: FR, daemon.pretty.js:33787)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.7.1, v0.8.4 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plugins.
// changelog v0.8.4 (high): `channel.spawn` takes an optional `session_key` and creates that session bound to the channel.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelSpawnParams(params) {
    return !(!isRecord(params) || typeof params.channel_kind != "string" || params.channel_kind.trim().length === 0 || typeof params.channel_id != "string" || params.channel_id.trim().length === 0 || params.cwd_abs !== void 0 && (typeof params.cwd_abs != "string" || params.cwd_abs.trim().length === 0) || params.runtime !== void 0 && !isAgentRuntime(params.runtime) || !isOptionalString(params.display_name) || !isOptionalString(params.bound_by) || params.require_mention !== void 0 && typeof params.require_mention != "boolean" || params.session_key !== void 0 && (typeof params.session_key != "string" || params.session_key.trim().length === 0))
}
