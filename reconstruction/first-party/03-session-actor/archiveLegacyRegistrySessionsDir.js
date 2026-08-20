// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: Lme, daemon.pretty.js:61002)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
    let t = e.registrySessionsDir,
        n;
    try {
        n = await nr.readdir(t)
    } catch {
        return !1
    }
    if (n.length === 0) {
        try {
            await nr.rmdir(t)
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
        let d = rr.join(t, u),
            p;
        try {
            p = await nr.readFile(d, "utf8")
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
            let S = f[T];
            typeof S == "string" && S.length > 0 && (m[T] = S)
        }
        let h = pQe.createHash("sha256").update(c).digest("hex"),
            y = rr.join(e.sessionsDir, h),
            _ = rr.join(y, "state.json"),
            k = rr.join(e.varDir, "sessions-archive"),
            v = !1;
        try {
            let T = await nr.readdir(k);
            for (let S of T)
                if (S === h || S.startsWith(`${h}.`)) {
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
            b = JSON.parse(await nr.readFile(_, "utf8"))
        } catch {
            b = null
        }
        let I = {
            ...m,
            ...b ?? {}
        };
        I.session_key = c, I.updated_at = new Date().toISOString(), delete I.status, delete I.idle_since, delete I.health;
        try {
            await xe(y), await nr.writeFile(_, JSON.stringify(I, null, 2) + `
`, "utf8"), r++
        } catch {
            i++
        }
    }
    let o = new Date().toISOString().replace(/[:.]/g, "-"),
        s = rr.join(e.varDir, `registry.legacy.${o}`),
        a = rr.join(s, "sessions");
    await xe(s);
    let l = a;
    try {
        await nr.access(l), l = `${a}.${process.pid}`
    } catch {}
    return await nr.rename(t, l), Z(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${l}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
