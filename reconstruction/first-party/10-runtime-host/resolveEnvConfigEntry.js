// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEnvConfigEntry  (minified: Hn, daemon.pretty.js:90565)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.3 (high): **daemon**: `system.config` RPC — inspect effective runtime configuration (network, sessions, cadence, SDK, paths) with source tracking (`env` / `default` / `unset`).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveEnvConfigEntry(envKey, defaultValue) {
    let rawValue = process.env[envKey];
    if (rawValue === void 0 || rawValue === "") return {
        value: defaultValue,
        source: defaultValue === null ? "unset" : "default"
    };
    if (Jbt(envKey)) return {
        value: "***",
        source: "env"
    };
    if (typeof defaultValue == "number") {
        let numericValue = Number(rawValue);
        return {
            value: Number.isFinite(numericValue) ? numericValue : rawValue,
            source: "env"
        }
    }
    return typeof defaultValue == "boolean" ? {
        value: parseEnvBooleanFlag(rawValue),
        source: "env"
    } : {
        value: rawValue,
        source: "env"
    }
}
