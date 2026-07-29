// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: eae, daemon.pretty.js:48157)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (eu) return eu;
    if (Vl) return Vl;
    Vl = (async () => {
        let t = new Promise(i => {
                try {
                    Lz(), i({
                        ok: !0
                    })
                } catch (s) {
                    let o = s instanceof Error ? s.message : String(s);
                    i({
                        ok: !1,
                        reason: o
                    })
                }
            }),
            n = new Promise(i => {
                setTimeout(() => i({
                    ok: !1,
                    reason: `[agent-sdk] claude availability probe timed out after ${Goe}ms`
                }), Goe)
            }),
            r = await Promise.race([t, n]);
        return eu = r, r
    })();
    let e = await Vl;
    return Vl = void 0, e
}
