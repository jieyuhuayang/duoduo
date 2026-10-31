// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: renderParamsProblem  (minified: Bm, daemon.pretty.js:32813)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderParamsProblem(method, problem) {
    if (/[.!?]$/.test(problem)) return problem;
    let acceptedKeys = Object.hasOwn(Lb, method) ? Lb[method] : null,
        acceptedKeysText = acceptedKeys === null ? "" : ` Accepted keys for ${method}: ${acceptedKeys.join(", ")}.`;
    return `${problem}. Nothing was ${W7e[method]??"done"}.${acceptedKeysText} Send it again with that fixed.`
}
