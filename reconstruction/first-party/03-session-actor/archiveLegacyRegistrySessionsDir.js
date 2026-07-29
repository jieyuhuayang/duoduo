// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: pde, daemon.pretty.js:58744)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
    let t = e.registrySessionsDir,
        n;
    try {
        n = await Yn.readdir(t)
    } catch {
        return !1
    }
    if (n.length === 0) {
        try {
            await Yn.rmdir(t)
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
        let d = Vn.join(t, u),
            p;
        try {
            p = await Yn.readFile(d, "utf8")
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
        for (let k of ["cwd", "plane", "permission_profile", "created_at", "last_event_id", "last_event_at"]) {
            let E = f[k];
            typeof E == "string" && E.length > 0 && (m[k] = E)
        }
        let h = b5e.createHash("sha256").update(l).digest("hex"),
            _ = Vn.join(e.sessionsDir, h),
            b = Vn.join(_, "state.json"),
            w = Vn.join(e.varDir, "sessions-archive"),
            v = !1;
        try {
            let k = await Yn.readdir(w);
            for (let E of k)
                if (E === h || E.startsWith(`${h}.`)) {
                    v = !0;
                    break
                }
        } catch {}
        if (v) {
            i++;
            continue
        }
        let g = null;
        try {
            g = JSON.parse(await Yn.readFile(b, "utf8"))
        } catch {
            g = null
        }
        let x = {
            ...m,
            ...g ?? {}
        };
        x.session_key = l, x.updated_at = new Date().toISOString(), delete x.status, delete x.idle_since, delete x.health;
        try {
            await _e(_), await Yn.writeFile(b, JSON.stringify(x, null, 2) + `
`, "utf8"), r++
        } catch {
            i++
        }
    }
    let s = new Date().toISOString().replace(/[:.]/g, "-"),
        o = Vn.join(e.varDir, `registry.legacy.${s}`),
        a = Vn.join(o, "sessions");
    await _e(o);
    let c = a;
    try {
        await Yn.access(c), c = `${a}.${process.pid}`
    } catch {}
    return await Yn.rename(t, c), se(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${c}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
