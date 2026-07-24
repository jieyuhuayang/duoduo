// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: Tle, daemon.pretty.js:58974)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
 let t = e.registrySessionsDir,
  n;
 try {
  n = await kn.readdir(t)
 } catch {
  return !1
 }
 if (n.length === 0) {
  try {
   await kn.rmdir(t)
  } catch {}
  return !1
 }
 let r = 0,
  i = 0;
 for (let u of n) {
  if (!u.endsWith(".json") || u === "sessions.snapshot.json" || u === ".initialized") continue;
  let l;
  try {
   l = decodeURIComponent(u.slice(0, -5))
  } catch {
   continue
  }
  let d = _n.join(t, u),
   p;
  try {
   p = await kn.readFile(d, "utf8")
  } catch {
   continue
  }
  let f;
  try {
   f = JSON.parse(p)
  } catch {
   continue
  }
  let m = {
   session_key: l
  };
  for (let x of ["cwd", "plane", "permission_profile", "created_at", "last_event_id", "last_event_at"]) {
   let R = f[x];
   typeof R == "string" && R.length > 0 && (m[x] = R)
  }
  let h = bKe.createHash("sha256")
   .update(l)
   .digest("hex"),
   g = _n.join(e.sessionsDir, h),
   v = _n.join(g, "state.json"),
   S = _n.join(e.varDir, "sessions-archive"),
   _ = !1;
  try {
   let x = await kn.readdir(S);
   for (let R of x)
    if (R === h || R.startsWith(`${h}.`)) {
     _ = !0;
     break
    }
  } catch {}
  if (_) {
   i++;
   continue
  }
  let b = null;
  try {
   b = JSON.parse(await kn.readFile(v, "utf8"))
  } catch {
   b = null
  }
  let w = {
   ...m,
   ...b ?? {}
  };
  w.session_key = l, w.updated_at = new Date()
   .toISOString(), delete w.status, delete w.idle_since, delete w.health;
  try {
   await ye(g), await kn.writeFile(v, JSON.stringify(w, null, 2) + `
`, "utf8"), r++
  } catch {
   i++
  }
 }
 let o = new Date()
  .toISOString()
  .replace(/[:.]/g, "-"),
  s = _n.join(e.varDir, `registry.legacy.${o}`),
  a = _n.join(s, "sessions");
 await ye(s);
 let c = a;
 try {
  await kn.access(c), c = `${a}.${process.pid}`
 } catch {}
 return await kn.rename(t, c), fe(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${c}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
