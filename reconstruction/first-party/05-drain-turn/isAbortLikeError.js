// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isAbortLikeError  (minified: Wh, daemon.pretty.js:54968)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAbortLikeError(e) {
    let t = new Set,
        n = e;
    for (; n && typeof n == "object" && !t.has(n);) {
        t.add(n);
        let r = n.name,
            i = n.code;
        if (r === "AbortError" || i === "ABORT_ERR") return !0;
        n = n.cause
    }
    return !1
}
