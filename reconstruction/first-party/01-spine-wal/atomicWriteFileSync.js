// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicWriteFileSync  (minified: Tqe, daemon.pretty.js:30954)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicWriteFileSync(e, t, n = new Date(t.ts)) {
 await ye(e.eventsDir);
 let r = HS(n),
  i = BS.join(e.eventsDir, r),
  o = `${JSON.stringify(t)}
`;
 return xqe(i, async () => {
  let s = await qS.open(i, "a");
  try {
   let c = (await s.stat())
    .size,
    l = (await s.write(o))
    .bytesWritten;
   return {
    event: t,
    partition: r,
    byteOffset: c,
    byteLength: l
   }
  } finally {
   await s.close()
  }
 })
}
