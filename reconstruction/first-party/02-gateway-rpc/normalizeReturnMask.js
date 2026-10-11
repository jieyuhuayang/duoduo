// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: normalizeReturnMask  (minified: CG, daemon.pretty.js:90618)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.3 (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (high): fix(daemon): add `stream_end` to pull stream return_mask whitelist (#40)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeReturnMask(returnMask) {
    if (!returnMask || returnMask.length === 0) return ["final", "stream"];
    let normalized = [];
    for (let kind of returnMask)(kind === "final" || kind === "stream" || kind === "stream_end" || kind === "tool") && !normalized.includes(kind) && normalized.push(kind);
    return normalized.length === 0 ? ["final", "stream"] : normalized
}
