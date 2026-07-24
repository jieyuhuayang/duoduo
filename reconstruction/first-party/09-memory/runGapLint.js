// duoduo reconstruction — subsystem: 09-memory
// symbol: runGapLint  (minified: loe, daemon.pretty.js:43213)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function runGapLint(e, t) {
 let n = kJe(e),
  r = xJe(t);
 for (let i = n.length - 1; i >= 0; i -= 1) {
  let o = n[i];
  if (r.has(o)) continue;
  let {
   count: s,
   hours: a
  } = EJe(uoe.join(e, `${o}.jsonl`));
  if (s === 0) continue;
  let c = TJe(a);
  return {
   gapDate: o,
   bands: c,
   selected: [{
    kind: Kr.SCAN_GAP,
    partition: "memory-weaver",
    pendingFilename: "scan-gap.md.pending",
    pendingBody: IJe(o, c, s)
   }]
  }
 }
 return {
  gapDate: null,
  bands: [],
  selected: []
 }
}
