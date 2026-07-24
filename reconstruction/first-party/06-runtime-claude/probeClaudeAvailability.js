// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: Yoe, daemon.pretty.js:48137)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (ec) return ec;
    if (Vl) return Vl;
    Vl = (async () => {
        let t = new Promise(i => {
                try {
                    Dz(), i({
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
                    reason: `[agent-sdk] claude availability probe timed out after ${Zoe}ms`
                }), Zoe)
            }),
            r = await Promise.race([t, n]);
        return ec = r, r
    })();
    let e = await Vl;
    return Vl = void 0, e
}
