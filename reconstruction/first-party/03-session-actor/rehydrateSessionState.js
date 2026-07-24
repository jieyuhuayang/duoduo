// duoduo reconstruction — subsystem: 03-session-actor
// symbol: rehydrateSessionState  (minified: nX, daemon.pretty.js:31019)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rehydrateSessionState(e) {
    let t = [],
        n;
    try {
        n = await Ji.readdir(e.sessionsDir)
    } catch {
        return t
    }
    for (let r of n) {
        let i = Ir.join(e.sessionsDir, r);
        if (!(!(await Ji.stat(i).catch(() => null))?.isDirectory() || !await R2e(i))) {
            try {
                let a = await Ji.readFile(Ir.join(i, "state.json"), "utf8"),
                    u = JSON.parse(a);
                if (u.session_key) {
                    t.push(u.session_key);
                    continue
                }
            } catch {}
            try {
                let a = await Ji.readdir(e.registrySessionsDir);
                for (let u of a)
                    if (!(!u.endsWith(".json") || u.startsWith(".") || u === "sessions.snapshot.json")) try {
                        let c = decodeURIComponent(u.slice(0, -5));
                        if (Gi(c) === r) {
                            t.push(c);
                            let l = Ir.join(i, "state.json");
                            try {
                                let d = JSON.parse(await Ji.readFile(l, "utf8"));
                                d.session_key = c, await Ji.writeFile(l, JSON.stringify(d, null, 2) + `
`)
                            } catch {}
                            break
                        }
                    } catch {}
            } catch {}
        }
    }
    return t
}
