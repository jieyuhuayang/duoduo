// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: recordChannelCapabilityDeclaration  (minified: pyt, daemon.pretty.js:89239)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordChannelCapabilityDeclaration(e) {
    let t = cyt(e.sessionKey),
        n = dyt(e.capabilities),
        r = e.declaredBy;
    await mutateSessionRuntimeState(e.paths, e.sessionKey, i => {
        let o = i.channel_capabilities ?? {},
            s = normalizeChannelCapabilityDeclarations(o[t]);
        return {
            channel_capabilities: {
                ...o,
                [t]: {
                    ...s,
                    [r]: {
                        declared_at: new Date().toISOString(),
                        declared_by: r,
                        outbound: n.outbound
                    }
                }
            }
        }
    })
}
