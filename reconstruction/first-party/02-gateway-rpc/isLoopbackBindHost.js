// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: isLoopbackBindHost  (minified: vst, daemon.pretty.js:81922)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isLoopbackBindHost(e) {
    let t = ZB(e.trim().toLowerCase());
    if (t === "localhost" || t === "::1") return !0;
    let n = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(t);
    return !!(n && n.slice(1).every(r => Number(r) <= 255))
}
