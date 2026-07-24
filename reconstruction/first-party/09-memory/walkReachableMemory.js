// duoduo reconstruction — subsystem: 09-memory
// symbol: walkReachableMemory  (minified: op, daemon.pretty.js:42925)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function walkReachableMemory(e, t) {
 let n = new Set,
  r = resolveMemoryLinkTargets(e)
  .filter(oL);
 for (let i of r) n.add(i);
 for (; r.length > 0;) {
  let i = new Set,
   o = [...r].sort(br);
  for (let s of o) {
   let a = t(s);
   if (a !== null)
    for (let c of resolveMemoryLinkTargets(a)) oL(c) && !n.has(c) && i.add(c)
  }
  r = [...i];
  for (let s of r) n.add(s)
 }
 return n
}
