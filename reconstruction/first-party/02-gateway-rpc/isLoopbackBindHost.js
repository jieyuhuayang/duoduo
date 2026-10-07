// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isLoopbackBindHost  (minified: vvt, daemon.pretty.js:92002)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (medium): The remote listener starts only when a host, a port and a token are all present, and every request must carry the token. A misconfigured remote setup — a public address with no token, or a port colliding with the read-only one — refuses to start rather than exposing anything.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLoopbackBindHost(e) {
    let t = MG(e.trim().toLowerCase());
    if (t === "localhost" || t === "::1") return !0;
    let n = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(t);
    return !!(n && n.slice(1).every(r => Number(r) <= 255))
}
