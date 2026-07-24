// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: markCadenceItemsDone  (minified: wQe, daemon.pretty.js:75226)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function markCadenceItemsDone(e, t) {
 if (t.length === 0) return;
 let r = (await ed.readFile(e.cadenceQueuePath, "utf8"))
  .split(`
`)
  .map(i => i.trim()
   .startsWith("- [ ]") && t.includes(i.trim()) ? i.replace("- [ ]", "- [x]") : i)
  .join(`
`);
 await At(e.cadenceQueuePath, `${r.replace(/\s+$/,"")}
`)
}
