// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: resolveRemoteListenerConfig  (minified: wst, daemon.pretty.js:81927)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveRemoteListenerConfig(e, t) {
    let n = e.ALADUO_DAEMON_HOST?.trim(),
        r = e.ALADUO_DAEMON_TOKEN?.trim(),
        i = e.ALADUO_REMOTE_PORT?.trim(),
        o = !!n,
        s = !!i,
        a = !!r,
        l = o && !isLoopbackBindHost(n);
    if (l && !a) throw new Error("remote exposure requires ALADUO_DAEMON_TOKEN; run `duoduo daemon token new`");
    if (!(o && s && a)) {
        if (l && a && !s) throw new Error("remote exposure requires an explicit ALADUO_REMOTE_PORT (a TCP port distinct from the read-only port); set ALADUO_REMOTE_PORT");
        return {
            enabled: !1
        }
    }
    let u = Number(i);
    if (!Number.isInteger(u) || u < 1 || u > 65535) throw new Error(`ALADUO_REMOTE_PORT must be a valid TCP port (1-65535), got: ${i}`);
    if (u === t) throw new Error(`ALADUO_REMOTE_PORT (${u}) must differ from the read-only port (${t})`);
    return {
        enabled: !0,
        host: n,
        port: u,
        token: r
    }
}
