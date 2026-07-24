// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: hasImageGenerationRecord  (minified: ule, daemon.pretty.js:58390)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasImageGenerationRecord(e) {
 let t = [e],
  n = new Set;
 for (; t.length > 0;) {
  let r = t.pop();
  if (!(!YT(r) || n.has(r))) {
   if (n.add(r), cle(r)) return !0;
   for (let i of ["payload", "event", "msg", "item"]) {
    let o = r[i];
    YT(o) && t.push(o)
   }
  }
 }
 return !1
}
