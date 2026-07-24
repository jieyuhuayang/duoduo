// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: batchDrainItems  (minified: IU, daemon.pretty.js:61297)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function batchDrainItems(e, t, n) {
 if (t.length === 0) return {
  items: [],
  events: new Map
 };
 let r = new Map,
  i = [],
  o = null,
  s = !0,
  a = !1,
  c = () => a ? Number.POSITIVE_INFINITY : n.fallbackBatchSize;
 for (let u of t) {
  if (i.length >= c()) break;
  let l = await R5e(e, u, r, n.perf);
  if (i.length === 0) {
   a = l ? kU(l) : !1, i.push(u), o = l ? rde(l.ts) : null, o === null && (s = !1);
   continue
  }
  if ((l ? kU(l) : !1) !== a) break;
  if (!s) {
   i.push(u);
   continue
  }
  let p = l ? rde(l.ts) : null;
  if (o === null || p === null) {
   s = !1, i.push(u);
   continue
  }
  if (Math.abs(p - o) > n.mergeWindowMs) break;
  i.push(u), o = p
 }
 return {
  items: i,
  events: r
 }
}
