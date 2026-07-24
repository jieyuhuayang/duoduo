// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: Mf, daemon.pretty.js:35325)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(e, t, n) {
 let r = drainRecordPath(e, t),
  i = [];
 try {
  let o = cHe(r, {
    encoding: "utf8"
   }),
   s = aHe.createInterface({
    input: o,
    crlfDelay: 1 / 0
   });
  for await (let a of s) if (a.trim()) try {
   let c = JSON.parse(a);
   c?.id && c?.session_key && (!n || new Date(c.drain_started_at) >= n) && i.push(c)
  } catch {}
 } catch (o) {
  if (o.code !== "ENOENT") throw o
 }
 return i
}
