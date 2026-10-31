// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: readEnvIntegerOrFallback  (minified: zTe, daemon.pretty.js:91986)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 0 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readEnvIntegerOrFallback(name, fallback, min) {
    let rawValue = process.env[name];
    if (!rawValue || rawValue.trim() === "") return fallback;
    let value = Number(rawValue);
    return !Number.isFinite(value) || !Number.isInteger(value) || value < min ? (logWarnMessage("[pid0] invalid env integer, using fallback", {
        name,
        value: rawValue,
        fallback,
        min
    }), fallback) : value
}
