// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: Dde, daemon.pretty.js:49864)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (qu) return qu;
    if (Jd) return Jd;
    Jd = (async () => {
        let t = new Promise(i => {
                try {
                    jq(), i({
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
                    reason: `[agent-sdk] claude availability probe timed out after ${Cde}ms`
                }), Cde)
            }),
            r = await Promise.race([t, n]);
        return qu = r, r
    })();
    let e = await Jd;
    return Jd = void 0, e
}
