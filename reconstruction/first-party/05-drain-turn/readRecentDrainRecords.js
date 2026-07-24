// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readRecentDrainRecords  (minified: lHe, daemon.pretty.js:35442)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readRecentDrainRecords(e, t) {
 await ye(e.usageDir);
 let n;
 try {
  n = await Tk.readdir(e.usageDir)
 } catch {
  return []
 }
 let r = [];
 for (let i of n) {
  if (!i.endsWith(".jsonl")) continue;
  let o = i.slice(0, -6),
   s = await readDrainRecords(e, o)
   .catch(() => []);
  r.push(...s)
 }
 return r.sort((i, o) => new Date(o.drain_started_at)
  .getTime() - new Date(i.drain_started_at)
  .getTime()), r.slice(0, t)
}
