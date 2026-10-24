// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isChannelFileUploadParams  (minified: NR, daemon.pretty.js:33763)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 channel.ts (maps/published_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isChannelFileUploadParams(params) {
    return !(!isRecord(params) || typeof params.session_key != "string" || typeof params.name != "string" || typeof params.mime != "string" || typeof params.content_base64 != "string")
}
