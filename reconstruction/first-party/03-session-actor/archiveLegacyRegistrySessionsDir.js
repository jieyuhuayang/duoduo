// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: Gke, daemon.pretty.js:69662)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
    let t = e.registrySessionsDir,
        n;
    try {
        n = await or.readdir(t)
    } catch {
        return !1
    }
    if (n.length === 0) {
        try {
            await or.rmdir(t)
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
        let d = sr.join(t, l),
            f;
        try {
            f = await or.readFile(d, "utf8")
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
        for (let R of ["cwd", "plane", "permission_profile", "created_at", "last_event_id", "last_event_at"]) {
            let P = p[R];
            typeof P == "string" && P.length > 0 && (m[R] = P)
        }
        let h = nmt.createHash("sha256").update(c).digest("hex"),
            g = sr.join(e.sessionsDir, h),
            y = sr.join(g, "state.json"),
            v = sr.join(e.varDir, "sessions-archive"),
            b = !1;
        try {
            let R = await or.readdir(v);
            for (let P of R)
                if (P === h || P.startsWith(`${h}.`)) {
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
            _ = JSON.parse(await or.readFile(y, "utf8"))
        } catch {
            _ = null
        }
        let E = {
            ...m,
            ..._ ?? {}
        };
        E.session_key = c, E.updated_at = new Date().toISOString(), delete E.status, delete E.idle_since, delete E.health;
        try {
            await ensureDirectoryExists(g), await or.writeFile(y, JSON.stringify(E, null, 2) + `
`, "utf8"), r++
        } catch {
            i++
        }
    }
    let o = new Date().toISOString().replace(/[:.]/g, "-"),
        s = sr.join(e.varDir, `registry.legacy.${o}`),
        a = sr.join(s, "sessions");
    await ensureDirectoryExists(s);
    let u = a;
    try {
        await or.access(u), u = `${a}.${process.pid}`
    } catch {}
    return await or.rename(t, u), logWarnMessage(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${u}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
