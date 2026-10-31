// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveRemoteListenerConfig  (minified: HSt, daemon.pretty.js:93521)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 0 from the code at the binding (rule), 10 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (high): The remote listener starts only when a host, a port and a token are all present, and every request must carry the token. A misconfigured remote setup — a public address with no token, or a port colliding with the read-only one — refuses to start rather than exposing anything.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRemoteListenerConfig(env, readOnlyPort) {
    let host = env.ALADUO_DAEMON_HOST?.trim(),
        token = env.ALADUO_DAEMON_TOKEN?.trim(),
        portText = env.ALADUO_REMOTE_PORT?.trim(),
        hasHost = !!host,
        hasPort = !!portText,
        hasToken = !!token,
        isRemoteHost = hasHost && !isLoopbackBindHost(host);
    if (isRemoteHost && !hasToken) throw new Error("remote exposure requires ALADUO_DAEMON_TOKEN; run `duoduo daemon token new`");
    if (!(hasHost && hasPort && hasToken)) {
        if (isRemoteHost && hasToken && !hasPort) throw new Error("remote exposure requires an explicit ALADUO_REMOTE_PORT (a TCP port distinct from the read-only port); set ALADUO_REMOTE_PORT");
        return {
            enabled: !1
        }
    }
    let port = Number(portText);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`ALADUO_REMOTE_PORT must be a valid TCP port (1-65535), got: ${portText}`);
    if (port === readOnlyPort) throw new Error(`ALADUO_REMOTE_PORT (${port}) must differ from the read-only port (${readOnlyPort})`);
    return {
        enabled: !0,
        host,
        port,
        token
    }
}
