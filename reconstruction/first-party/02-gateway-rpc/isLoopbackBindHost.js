// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isLoopbackBindHost  (minified: $yt, daemon.pretty.js:90388)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLoopbackBindHost(e) {
    let t = kJ(e.trim().toLowerCase());
    if (t === "localhost" || t === "::1") return !0;
    let n = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(t);
    return !!(n && n.slice(1).every(r => Number(r) <= 255))
}
