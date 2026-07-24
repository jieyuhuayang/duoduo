// duoduo reconstruction — subsystem: 09-memory
// symbol: detectOrphanMemory  (minified: moe, daemon.pretty.js:43309)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function detectOrphanMemory(e, t) {
 let n = $Je(e, {
  resolve: t.resolve
 });
 if (n.missing) return {
  missing: !0,
  states: []
 };
 let r = t.newbornHours ?? Jx;
 return {
  missing: !1,
  states: n.orphans.map(o => {
   let s = o.mtimeMs > 0 ? (t.refTimestampMs - o.mtimeMs) / poe : Number.POSITIVE_INFINITY,
    a = o.indeg >= 1 ? "ISLAND" : s < r ? "NEWBORN" : "STALE";
   return {
    ...o,
    ageHours: s,
    state: a
   }
  })
 }
}
