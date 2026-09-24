// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: normalizeChannelCapabilityDeclarations  (minified: fyt, daemon.pretty.js:89229)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeChannelCapabilityDeclarations(e) {
    if (!e) return {};
    if (typeof e.declared_at == "string") {
        let t = e;
        return {
            [t.declared_by]: t
        }
    }
    return e
}
