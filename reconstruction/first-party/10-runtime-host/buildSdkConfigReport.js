// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildSdkConfigReport  (minified: Wbt, daemon.pretty.js:90550)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSdkConfigReport() {
    let e = {
            permission_mode: resolveEnvConfigEntry("ALADUO_PERMISSION_MODE", "default")
        },
        t = readClaudeAuthSourceEnv(process.env) ?? null;
    if (e.claude_auth_source = t === null ? {
            value: null,
            source: "unset"
        } : {
            value: t,
            source: "env"
        }, t === "claude_code_local") return e;
    for (let n of Vbt) {
        let r = resolveEnvConfigEntry(n, null);
        r.source !== "unset" && (e[Hbt(n)] = r)
    }
    return e
}
