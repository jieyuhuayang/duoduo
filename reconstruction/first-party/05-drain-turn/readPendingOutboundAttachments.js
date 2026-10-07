// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readPendingOutboundAttachments  (minified: MW, daemon.pretty.js:72105)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPendingOutboundAttachments(e, t) {
    let r = (await readSessionRuntimeState(e, t))?.pending_outbound_attachments;
    if (!(!r || r.length === 0)) return mergeOutboundAttachmentLists(r)
}
