// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: parseCadenceQueue  (minified: vme, daemon.pretty.js:75215)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function parseCadenceQueue(e) {
 let t;
 try {
  t = await ed.readFile(e.cadenceQueuePath, "utf8")
 } catch {
  return []
 }
 return xQe(t)
  .filter(r => r.trim()
   .startsWith("- [ ]"))
}
