// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: composeIdentityLayer  (minified: yC, daemon.pretty.js:56659)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function composeIdentityLayer(metaPrompt, rolePrompt) {
    let identityLayer = [metaPrompt, rolePrompt].filter(Boolean).join(`

`);
    return identityLayer.length > 0 ? identityLayer : void 0
}
