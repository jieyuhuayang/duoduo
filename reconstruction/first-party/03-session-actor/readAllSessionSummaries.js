// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionSummaries  (minified: C1, daemon.pretty.js:35405)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionSummaries(e, t) {
 await ye(e.usageDir);
 let n;
 try {
  n = await Tk.readdir(e.usageDir)
 } catch {
  return {}
 }
 let r = {};
 for (let i of n) {
  if (!i.endsWith(".jsonl")) continue;
  let o = i.slice(0, -6),
   s = await readDrainRecords(e, o, t)
   .catch(() => []);
  s.length > 0 && (r[o] = summarizeDrainRecords(s))
 }
 return r
}
