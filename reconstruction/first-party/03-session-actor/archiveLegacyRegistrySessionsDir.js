// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: rSe, daemon.pretty.js:69374)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
    let t = e.registrySessionsDir,
        n;
    try {
        n = await er.readdir(t)
    } catch {
        return !1
    }
    if (n.length === 0) {
        try {
            await er.rmdir(t)
        } catch {}
        return !1
    }
    let r = 0,
        i = 0;
    for (let l of n) {
        if (!l.endsWith(".json") || l === "sessions.snapshot.json" || l === ".initialized") continue;
        let c;
        try {
            c = decodeURIComponent(l.slice(0, -5))
        } catch {
            continue
        }
        let d = tr.join(t, l),
            f;
        try {
            f = await er.readFile(d, "utf8")
        } catch {
            continue
        }
        let p;
        try {
            p = JSON.parse(f)
        } catch {
            continue
        }
        let m = {
            session_key: c
        };
        for (let E of ["cwd", "plane", "permission_profile", "created_at", "last_event_id", "last_event_at"]) {
            let R = p[E];
            typeof R == "string" && R.length > 0 && (m[E] = R)
        }
        let h = hdt.createHash("sha256").update(c).digest("hex"),
            g = tr.join(e.sessionsDir, h),
            y = tr.join(g, "state.json"),
            v = tr.join(e.varDir, "sessions-archive"),
            b = !1;
        try {
            let E = await er.readdir(v);
            for (let R of E)
                if (R === h || R.startsWith(`${h}.`)) {
                    b = !0;
                    break
                }
        } catch {}
        if (b) {
            i++;
            continue
        }
        let _ = null;
        try {
            _ = JSON.parse(await er.readFile(y, "utf8"))
        } catch {
            _ = null
        }
        let I = {
            ...m,
            ..._ ?? {}
        };
        I.session_key = c, I.updated_at = new Date().toISOString(), delete I.status, delete I.idle_since, delete I.health;
        try {
            await Oe(g), await er.writeFile(y, JSON.stringify(I, null, 2) + `
`, "utf8"), r++
        } catch {
            i++
        }
    }
    let o = new Date().toISOString().replace(/[:.]/g, "-"),
        s = tr.join(e.varDir, `registry.legacy.${o}`),
        a = tr.join(s, "sessions");
    await Oe(s);
    let u = a;
    try {
        await er.access(u), u = `${a}.${process.pid}`
    } catch {}
    return await er.rename(t, u), Z(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${u}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
