// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: bindSessionSourceChannel  (minified: gIe, daemon.pretty.js:90523)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.4 (high): `channel.ingress` and `channel.command` validate `channel_id` before they bind the session. A malformed id used to rebind an existing session to it and was refused only afterwards.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function bindSessionSourceChannel(paths, sessionKey, channelId) {
    channelId && (assertValidChannelId(channelId), await patchSessionRuntimeState(paths, sessionKey, {
        source_channel_id: channelId
    }))
}
