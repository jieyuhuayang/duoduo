// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: probeClaudeAvailability  (minified: Que, daemon.pretty.js:57086)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function probeClaudeAvailability() {
 if (Yc) return Yc;
 if (Vl) return Vl;
 Vl = (async () => {
  let t = new Promise(i => {
    try {
     iU(), i({
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
     reason: `[agent-sdk] claude availability probe timed out after ${Kue}ms`
    }), Kue)
   }),
   r = await Promise.race([t, n]);
  return Yc = r, r
 })();
 let e = await Vl;
 return Vl = void 0, e
}
