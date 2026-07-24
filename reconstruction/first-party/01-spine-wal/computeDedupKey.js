// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: computeDedupKey  (minified: YX, daemon.pretty.js:75649)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeDedupKey(e, t = 5) {
 let n = e.source?.kind ?? "unknown",
  r = e.dedup;
 if (r?.source_id) return `${n}:${r.source_id}`;
 if (e.type === "channel.command") return null;
 if (r?.hash) {
  let i = KX(e.ts, t);
  return `${n}:hash:${r.hash}:${i}`
 }
 if (e.payload?.text) {
  let i = r2e(e.payload.text),
   o = KX(e.ts, t);
  return `${n}:text:${i}:${o}`
 }
 return null
}
