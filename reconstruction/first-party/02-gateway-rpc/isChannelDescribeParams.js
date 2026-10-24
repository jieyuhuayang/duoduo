// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelDescribeParams  (minified: LR, daemon.pretty.js:33783)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): new `channel.describe` / `channel.spawn` RPCs expose the instance lifecycle to channel plugins.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelDescribeParams(params) {
    return !(!isRecord(params) || typeof params.channel_kind != "string" || params.channel_kind.trim().length === 0 || typeof params.channel_id != "string" || params.channel_id.trim().length === 0 || !isOptionalString(params.session_key))
}
