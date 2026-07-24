// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: rde, daemon.pretty.js:58622)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(e) {
    let t = e.registrySessionsDir,
        n;
    try {
        n = await Qn.readdir(t)
    } catch {
        return !1
    }
    if (n.length === 0) {
        try {
            await Qn.rmdir(t)
        } catch {}
        return !1
    }
    let r = 0,
        i = 0;
    for (let c of n) {
        if (!c.endsWith(".json") || c === "sessions.snapshot.json" || c === ".initialized") continue;
        let l;
        try {
            l = decodeURIComponent(c.slice(0, -5))
        } catch {
            continue
        }
        let d = Bn.join(t, c),
            p;
        try {
            p = await Qn.readFile(d, "utf8")
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
        let h = s5e.createHash("sha256").update(l).digest("hex"),
            _ = Bn.join(e.sessionsDir, h),
            b = Bn.join(_, "state.json"),
            v = Bn.join(e.varDir, "sessions-archive"),
            w = !1;
        try {
            let k = await Qn.readdir(v);
            for (let E of k)
                if (E === h || E.startsWith(`${h}.`)) {
                    w = !0;
                    break
                }
        } catch {}
        if (w) {
            i++;
            continue
        }
        let g = null;
        try {
            g = JSON.parse(await Qn.readFile(b, "utf8"))
        } catch {
            g = null
        }
        let x = {
            ...m,
            ...g ?? {}
        };
        x.session_key = l, x.updated_at = new Date().toISOString(), delete x.status, delete x.idle_since, delete x.health;
        try {
            await ge(_), await Qn.writeFile(b, JSON.stringify(x, null, 2) + `
`, "utf8"), r++
        } catch {
            i++
        }
    }
    let s = new Date().toISOString().replace(/[:.]/g, "-"),
        o = Bn.join(e.varDir, `registry.legacy.${s}`),
        a = Bn.join(o, "sessions");
    await ge(o);
    let u = a;
    try {
        await Qn.access(u), u = `${a}.${process.pid}`
    } catch {}
    return await Qn.rename(t, u), ie(`[init] archived legacy var/registry/sessions/ (${n.length} entries, backfilled=${r}, skipped=${i}) → ${u}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
