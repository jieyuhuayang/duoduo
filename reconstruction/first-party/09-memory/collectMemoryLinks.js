// duoduo reconstruction — subsystem: 09-memory
// symbol: collectMemoryLinks  (minified: ip, daemon.pretty.js:42910)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectMemoryLinks(e) {
 return t => {
  if (!oL(t)) return null;
  let n = ar(iL.join(e.topicsDir, `${t}.md`)),
   r = ar(iL.join(e.entitiesDir, `${t}.md`)),
   i = [];
  if (n !== null && i.push(n), r !== null && i.push(r), i.length > 0) {
   let o = ar(iL.join(e.effectivenessDir, `${t}.md`));
   o !== null && i.push(o)
  }
  return i.length > 0 ? i.join(`
`) : null
 }
}
