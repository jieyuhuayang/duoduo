// duoduo reconstruction — subsystem: 03-session-actor
// symbol: rehydrateSessionState  (minified: oX, daemon.pretty.js:31039)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rehydrateSessionState(e) {
    let t = [],
        n;
    try {
        n = await Wi.readdir(e.sessionsDir)
    } catch {
        return t
    }
    for (let r of n) {
        let i = Rr.join(e.sessionsDir, r);
        if (!(!(await Wi.stat(i).catch(() => null))?.isDirectory() || !await U2e(i))) {
            try {
                let a = await Wi.readFile(Rr.join(i, "state.json"), "utf8"),
                    c = JSON.parse(a);
                if (c.session_key) {
                    t.push(c.session_key);
                    continue
                }
            } catch {}
            try {
                let a = await Wi.readdir(e.registrySessionsDir);
                for (let c of a)
                    if (!(!c.endsWith(".json") || c.startsWith(".") || c === "sessions.snapshot.json")) try {
                        let u = decodeURIComponent(c.slice(0, -5));
                        if (Gi(u) === r) {
                            t.push(u);
                            let l = Rr.join(i, "state.json");
                            try {
                                let d = JSON.parse(await Wi.readFile(l, "utf8"));
                                d.session_key = u, await Wi.writeFile(l, JSON.stringify(d, null, 2) + `
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
