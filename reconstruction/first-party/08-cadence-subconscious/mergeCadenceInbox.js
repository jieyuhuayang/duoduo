// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: mergeCadenceInbox  (minified: _me, daemon.pretty.js:75178)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeCadenceInbox(e) {
 let t = [],
  n = [];
 try {
  let s = await ed.readdir(e.cadenceInboxDir, {
   withFileTypes: !0
  });
  t = s.filter(a => a.isFile() && a.name.endsWith(".pending"))
   .map(a => a.name)
   .sort(), n = s.filter(a => a.isFile() && !a.name.endsWith(".pending"))
   .map(a => a.name)
   .sort()
 } catch {
  return 0
 }
 if (n.length > 0) {
  for (let s of n) await ed.unlink(OI.join(e.cadenceInboxDir, s));
  ee("[cadence] removed incompatible inbox files", {
   removed: n.length
  })
 }
 let r = await ed.readFile(e.cadenceQueuePath, "utf8"),
  i = [],
  o = [];
 for (let s of t) {
  let c = (await ed.readFile(OI.join(e.cadenceInboxDir, s), "utf8"))
   .trim();
  c && i.push(c.startsWith("- [ ]") ? c : `- [ ] ${c}`), o.push(s)
 }
 if (i.length > 0) {
  let s = kQe(r, i);
  await At(e.cadenceQueuePath, s)
 }
 if (o.length === 0) return 0;
 for (let s of o) await ed.unlink(OI.join(e.cadenceInboxDir, s));
 return i.length
}
