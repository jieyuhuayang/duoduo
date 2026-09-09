// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: e_e, daemon.pretty.js:63516)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
    let t = e.registrySessionsDir,
        n;
    try {
        n = await Jn.readdir(t)
    } catch {
        return !1
    }
    if (n.length === 0) {
        try {
            await Jn.rmdir(t)
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
        let d = Gn.join(t, u),
            p;
        try {
            p = await Jn.readFile(d, "utf8")
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
        for (let T of ["cwd", "plane", "permission_profile", "created_at", "last_event_id", "last_event_at"]) {
            let P = f[T];
            typeof P == "string" && P.length > 0 && (m[T] = P)
        }
        let h = Zit.createHash("sha256").update(c).digest("hex"),
            g = Gn.join(e.sessionsDir, h),
            y = Gn.join(g, "state.json"),
            w = Gn.join(e.varDir, "sessions-archive"),
            v = !1;
        try {
            let T = await Jn.readdir(w);
            for (let P of T)
                if (P === h || P.startsWith(`${h}.`)) {
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
            b = JSON.parse(await Jn.readFile(y, "utf8"))
        } catch {
            b = null
        }
        let I = {
            ...m,
            ...b ?? {}
        };
        I.session_key = c, I.updated_at = new Date().toISOString(), delete I.status, delete I.idle_since, delete I.health;
        try {
            await Te(g), await Jn.writeFile(y, JSON.stringify(I, null, 2) + `
`, "utf8"), r++
        } catch {
            i++
        }
    }
    let o = new Date().toISOString().replace(/[:.]/g, "-"),
        s = Gn.join(e.varDir, `registry.legacy.${o}`),
        a = Gn.join(s, "sessions");
    await Te(s);
    let l = a;
    try {
        await Jn.access(l), l = `${a}.${process.pid}`
    } catch {}
    return await Jn.rename(t, l), W(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${l}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
