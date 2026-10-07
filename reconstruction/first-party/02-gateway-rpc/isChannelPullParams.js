// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelPullParams  (minified: Mm, daemon.pretty.js:31689)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.7, v0.8.4 (maps/history_daemon.json)
// changelog v0.8.4 (high): `channel.pull` accepts `advance: "ack"`: the stream pushes records as before, and only `channel.ack` moves the consumer's cursor.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelPullParams(e) {
    return !(!isRecord(e) || typeof e.session_key != "string" || typeof e.consumer_id != "string" || e.consumer_id.trim().length === 0 || e.cursor !== void 0 && typeof e.cursor != "string" || e.limit !== void 0 && (typeof e.limit != "number" || !Number.isInteger(e.limit) || e.limit <= 0) || e.wait_ms !== void 0 && (typeof e.wait_ms != "number" || !Number.isInteger(e.wait_ms) || e.wait_ms < 0) || e.return_mask !== void 0 && (!Array.isArray(e.return_mask) || !e.return_mask.every(t => t === "final" || t === "stream" || t === "stream_end" || t === "tool")) || !isChannelCapabilities(e.channel_capabilities) || e.advance !== void 0 && e.advance !== "ack")
}
