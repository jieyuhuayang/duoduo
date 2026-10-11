// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: normalizeChannelCapabilityDeclarations  (minified: Kbt, daemon.pretty.js:90648)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.3 (medium): **daemon**: Per-consumer channel capabilities to prevent overwrite race ([#7](https://github.com/openduo/duoduo/issues/7)).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeChannelCapabilityDeclarations(declarations) {
    if (!declarations) return {};
    if (typeof declarations.declared_at == "string") {
        let declaration = declarations;
        return {
            [declaration.declared_by]: declaration
        }
    }
    return declarations
}
