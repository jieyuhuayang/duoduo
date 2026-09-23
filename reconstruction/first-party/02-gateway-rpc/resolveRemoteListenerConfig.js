// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveRemoteListenerConfig  (minified: Oyt, daemon.pretty.js:90395)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRemoteListenerConfig(e, t) {
    let n = e.ALADUO_DAEMON_HOST?.trim(),
        r = e.ALADUO_DAEMON_TOKEN?.trim(),
        i = e.ALADUO_REMOTE_PORT?.trim(),
        o = !!n,
        s = !!i,
        a = !!r,
        u = o && !isLoopbackBindHost(n);
    if (u && !a) throw new Error("remote exposure requires ALADUO_DAEMON_TOKEN; run `duoduo daemon token new`");
    if (!(o && s && a)) {
        if (u && a && !s) throw new Error("remote exposure requires an explicit ALADUO_REMOTE_PORT (a TCP port distinct from the read-only port); set ALADUO_REMOTE_PORT");
        return {
            enabled: !1
        }
    }
    let l = Number(i);
    if (!Number.isInteger(l) || l < 1 || l > 65535) throw new Error(`ALADUO_REMOTE_PORT must be a valid TCP port (1-65535), got: ${i}`);
    if (l === t) throw new Error(`ALADUO_REMOTE_PORT (${l}) must differ from the read-only port (${t})`);
    return {
        enabled: !0,
        host: n,
        port: l,
        token: r
    }
}
