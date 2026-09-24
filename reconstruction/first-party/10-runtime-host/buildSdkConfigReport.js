// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildSdkConfigReport  (minified: uyt, daemon.pretty.js:89131)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSdkConfigReport() {
    let e = {
            permission_mode: qn("ALADUO_PERMISSION_MODE", "default")
        },
        t = readClaudeAuthSourceEnv(process.env) ?? null;
    if (e.claude_auth_source = t === null ? {
            value: null,
            source: "unset"
        } : {
            value: t,
            source: "env"
        }, t === "claude_code_local") return e;
    for (let n of syt) {
        let r = qn(n, null);
        r.source !== "unset" && (e[ayt(n)] = r)
    }
    return e
}
