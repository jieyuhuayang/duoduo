// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveEnvConfigEntry  (minified: Hn, daemon.pretty.js:90519)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
