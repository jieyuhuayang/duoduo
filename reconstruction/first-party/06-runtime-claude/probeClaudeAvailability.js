// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: Hce, daemon.pretty.js:49317)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (Ou) return Ou;
    if (Nd) return Nd;
    Nd = (async () => {
        let t = new Promise(i => {
                try {
                    sq(), i({
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
                    reason: `[agent-sdk] claude availability probe timed out after ${Fce}ms`
                }), Fce)
            }),
            r = await Promise.race([t, n]);
        return Ou = r, r
    })();
    let e = await Nd;
    return Nd = void 0, e
}
