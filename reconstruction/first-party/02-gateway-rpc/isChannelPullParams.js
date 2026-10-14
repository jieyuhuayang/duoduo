// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelPullParams  (minified: Dm, daemon.pretty.js:31689)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.7, v0.8.4 (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `channel.pull` accepts `advance: "ack"`: the stream pushes records as before, and only `channel.ack` moves the consumer's cursor.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelPullParams(params) {
    return !(!isRecord(params) || typeof params.session_key != "string" || typeof params.consumer_id != "string" || params.consumer_id.trim().length === 0 || params.cursor !== void 0 && typeof params.cursor != "string" || params.limit !== void 0 && (typeof params.limit != "number" || !Number.isInteger(params.limit) || params.limit <= 0) || params.wait_ms !== void 0 && (typeof params.wait_ms != "number" || !Number.isInteger(params.wait_ms) || params.wait_ms < 0) || params.return_mask !== void 0 && (!Array.isArray(params.return_mask) || !params.return_mask.every(maskEntry => maskEntry === "final" || maskEntry === "stream" || maskEntry === "stream_end" || maskEntry === "tool")) || !isChannelCapabilities(params.channel_capabilities) || params.advance !== void 0 && params.advance !== "ack")
}
