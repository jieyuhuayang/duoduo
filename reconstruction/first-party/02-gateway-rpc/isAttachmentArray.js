// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isAttachmentArray  (minified: O8e, daemon.pretty.js:31709)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAttachmentArray(e) {
    return e === void 0 ? !0 : Array.isArray(e) ? e.every(t => isRecord(t) ? typeof t.path == "string" && typeof t.mime == "string" : !1) : !1
}
