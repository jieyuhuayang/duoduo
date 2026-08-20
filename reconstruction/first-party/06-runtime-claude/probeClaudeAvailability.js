// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: Cue, daemon.pretty.js:49119)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
    if (wu) return wu;
    if (kd) return kd;
    kd = (async () => {
        let t = new Promise(i => {
                try {
                    wU(), i({
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
                    reason: `[agent-sdk] claude availability probe timed out after ${Eue}ms`
                }), Eue)
            }),
            r = await Promise.race([t, n]);
        return wu = r, r
    })();
    let e = await kd;
    return kd = void 0, e
}
