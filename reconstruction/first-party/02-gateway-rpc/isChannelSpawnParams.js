// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelSpawnParams  (minified: kR, daemon.pretty.js:31705)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelSpawnParams(e) {
    return !(!isRecord(e) || typeof e.channel_kind != "string" || e.channel_kind.trim().length === 0 || typeof e.channel_id != "string" || e.channel_id.trim().length === 0 || e.cwd_abs !== void 0 && (typeof e.cwd_abs != "string" || e.cwd_abs.trim().length === 0) || e.runtime !== void 0 && !isAgentRuntime(e.runtime) || !isOptionalString(e.display_name) || !isOptionalString(e.bound_by) || e.require_mention !== void 0 && typeof e.require_mention != "boolean" || e.session_key !== void 0 && (typeof e.session_key != "string" || e.session_key.trim().length === 0))
}
