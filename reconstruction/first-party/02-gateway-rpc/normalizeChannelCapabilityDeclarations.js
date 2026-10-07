// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: normalizeChannelCapabilityDeclarations  (minified: Kbt, daemon.pretty.js:90648)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.3.3 (medium): **daemon**: Per-consumer channel capabilities to prevent overwrite race ([#7](https://github.com/openduo/duoduo/issues/7)).
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
