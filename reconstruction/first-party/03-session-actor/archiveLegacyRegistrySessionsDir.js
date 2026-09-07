// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: sye, daemon.pretty.js:62929)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
    let t = e.registrySessionsDir,
        n;
    try {
        n = await Wn.readdir(t)
    } catch {
        return !1
    }
    if (n.length === 0) {
        try {
            await Wn.rmdir(t)
        } catch {}
        return !1
    }
    let r = 0,
        i = 0;
    for (let u of n) {
        if (!u.endsWith(".json") || u === "sessions.snapshot.json" || u === ".initialized") continue;
        let c;
        try {
            c = decodeURIComponent(u.slice(0, -5))
        } catch {
            continue
        }
        let d = Jn.join(t, u),
            p;
        try {
            p = await Wn.readFile(d, "utf8")
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
            session_key: c
        };
        for (let I of ["cwd", "plane", "permission_profile", "created_at", "last_event_id", "last_event_at"]) {
            let T = f[I];
            typeof T == "string" && T.length > 0 && (m[I] = T)
        }
        let h = grt.createHash("sha256").update(c).digest("hex"),
            g = Jn.join(e.sessionsDir, h),
            y = Jn.join(g, "state.json"),
            w = Jn.join(e.varDir, "sessions-archive"),
            v = !1;
        try {
            let I = await Wn.readdir(w);
            for (let T of I)
                if (T === h || T.startsWith(`${h}.`)) {
                    v = !0;
                    break
                }
        } catch {}
        if (v) {
            i++;
            continue
        }
        let b = null;
        try {
            b = JSON.parse(await Wn.readFile(y, "utf8"))
        } catch {
            b = null
        }
        let R = {
            ...m,
            ...b ?? {}
        };
        R.session_key = c, R.updated_at = new Date().toISOString(), delete R.status, delete R.idle_since, delete R.health;
        try {
            await Te(g), await Wn.writeFile(y, JSON.stringify(R, null, 2) + `
`, "utf8"), r++
        } catch {
            i++
        }
    }
    let o = new Date().toISOString().replace(/[:.]/g, "-"),
        s = Jn.join(e.varDir, `registry.legacy.${o}`),
        a = Jn.join(s, "sessions");
    await Te(s);
    let l = a;
    try {
        await Wn.access(l), l = `${a}.${process.pid}`
    } catch {}
    return await Wn.rename(t, l), J(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${l}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
