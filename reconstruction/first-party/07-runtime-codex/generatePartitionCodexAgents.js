// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generatePartitionCodexAgents  (minified: yKe, daemon.pretty.js:58834)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generatePartitionCodexAgents(e, t = {}) {
 let n = Xo.join(e, ".claude", "agents"),
  r = Xo.join(e, ".codex", "agents"),
  i = {
   generated: [],
   skipped: [],
   removed: [],
   errors: []
  },
  o = await _Ke(r),
  s;
 try {
  s = (await qs.readdir(n, {
    withFileTypes: !0
   }))
   .filter(u => u.isFile() && u.name.endsWith(".md"))
   .map(u => Xo.join(n, u.name))
 } catch (c) {
  if (c?.code === "ENOENT") {
   if (t.removeStale !== !1) {
    for (let l of o) await qs.rm(l, {
      force: !0
     })
     .catch(() => {}), i.removed.push(l);
    await qs.rmdir(r)
     .catch(() => {})
   }
   return i
  }
  throw c
 }
 await qs.mkdir(r, {
  recursive: !0
 });
 let a = new Set;
 for (let c of s) try {
  let u = await qs.readFile(c, "utf8"),
   l = parseAgentMarkdown(c, u),
   d = Xo.join(r, `${l.name}.toml`),
   p = renderAgentToml(l);
  a.add(Xo.resolve(d));
  let f = await qs.readFile(d, "utf8")
   .catch(() => {});
  if (f !== void 0 && vKe(f, p)) {
   i.skipped.push({
    sourcePath: c,
    targetPath: d,
    agentName: l.name
   });
   continue
  }
  let m = `${d}.tmp-${process.pid}-${Date.now()}`;
  await qs.writeFile(m, p, "utf8"), await qs.rename(m, d), i.generated.push({
   sourcePath: c,
   targetPath: d,
   agentName: l.name
  })
 } catch (u) {
  i.errors.push({
   path: c,
   reason: u instanceof Error ? u.message : String(u)
  })
 }
 if (t.removeStale !== !1)
  for (let c of o) a.has(Xo.resolve(c)) || (await qs.rm(c, {
    force: !0
   })
   .catch(() => {}), i.removed.push(c));
 return i
}
