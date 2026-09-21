// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: Che, daemon.pretty.js:54990)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (dc) return dc;
    if (xf) return xf;
    xf = (async () => {
        let t = new Promise(i => {
                try {
                    mB(), i({
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
                    reason: `[agent-sdk] claude availability probe timed out after ${Ehe}ms`
                }), Ehe)
            }),
            r = await Promise.race([t, n]);
        return dc = r, r
    })();
    let e = await xf;
    return xf = void 0, e
}
