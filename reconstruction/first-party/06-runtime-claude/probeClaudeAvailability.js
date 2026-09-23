// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: $he, daemon.pretty.js:54990)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (dc) return dc;
    if (xf) return xf;
    xf = (async () => {
        let t = new Promise(i => {
                try {
                    hB(), i({
                        ok: !0
                    })
                } catch (o) {
                    let s = o instanceof Error ? o.message : String(o);
                    i({
                        ok: !1,
                        reason: s
                    })
                }
            }),
            n = new Promise(i => {
                setTimeout(() => i({
                    ok: !1,
                    reason: `[agent-sdk] claude availability probe timed out after ${Rhe}ms`
                }), Rhe)
            }),
            r = await Promise.race([t, n]);
        return dc = r, r
    })();
    let e = await xf;
    return xf = void 0, e
}
