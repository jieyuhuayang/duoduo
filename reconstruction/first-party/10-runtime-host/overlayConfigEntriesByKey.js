// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: overlayConfigEntriesByKey  (minified: Z6, daemon.pretty.js:65831)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function overlayConfigEntriesByKey(base, overlay, mapValue) {
    if (!overlay) return base;
    let merged = {
        ...base ?? {}
    };
    for (let [key, value] of Object.entries(overlay)) merged[key] = mapValue(value);
    return merged
}
