// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: clearPendingOutboundAttachments  (minified: gA, daemon.pretty.js:72102)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function clearPendingOutboundAttachments(e, t) {
    await clearSessionRuntimeStateField(e, t, "pending_outbound_attachments")
}
