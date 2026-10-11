// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: recordChannelCapabilityDeclaration  (minified: Ybt, daemon.pretty.js:90658)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.3 (maps/history_daemon.json)
// locals: 7 renamed — 2 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.3 (medium): **daemon**: Per-consumer channel capabilities to prevent overwrite race ([#7](https://github.com/openduo/duoduo/issues/7)).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordChannelCapabilityDeclaration(options) {
    let consumerKey = Gbt(options.sessionKey),
        capabilities = Zbt(options.capabilities),
        declaredBy = options.declaredBy;
    await mutateSessionRuntimeState(options.paths, options.sessionKey, state => {
        let channelCapabilities = state.channel_capabilities ?? {},
            channelCapabilityDeclarations = normalizeChannelCapabilityDeclarations(channelCapabilities[consumerKey]);
        return {
            channel_capabilities: {
                ...channelCapabilities,
                [consumerKey]: {
                    ...channelCapabilityDeclarations,
                    [declaredBy]: {
                        declared_at: new Date().toISOString(),
                        declared_by: declaredBy,
                        outbound: capabilities.outbound
                    }
                }
            }
        }
    })
}
