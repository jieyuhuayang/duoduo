// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEnvConfigEntry  (minified: Hn, daemon.pretty.js:90519)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.3.3 (high): **daemon**: `system.config` RPC — inspect effective runtime configuration (network, sessions, cadence, SDK, paths) with source tracking (`env` / `default` / `unset`).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveEnvConfigEntry(e, t) {
    let n = process.env[e];
    if (n === void 0 || n === "") return {
        value: t,
        source: t === null ? "unset" : "default"
    };
    if (Bbt(e)) return {
        value: "***",
        source: "env"
    };
    if (typeof t == "number") {
        let r = Number(n);
        return {
            value: Number.isFinite(r) ? r : n,
            source: "env"
        }
    }
    return typeof t == "boolean" ? {
        value: parseEnvBooleanFlag(n),
        source: "env"
    } : {
        value: n,
        source: "env"
    }
}
