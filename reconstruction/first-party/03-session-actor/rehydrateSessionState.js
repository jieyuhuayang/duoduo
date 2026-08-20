// duoduo reconstruction — subsystem: 03-session-actor
// symbol: rehydrateSessionState  (minified: Ete, daemon.pretty.js:31601)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rehydrateSessionState(e) {
    let t = [],
        n;
    try {
        n = await go.readdir(e.sessionsDir)
    } catch {
        return t
    }
    for (let r of n) {
        let i = Lr.join(e.sessionsDir, r);
        if (!(!(await go.stat(i).catch(() => null))?.isDirectory() || !await cVe(i))) {
            try {
                let a = await go.readFile(Lr.join(i, "state.json"), "utf8"),
                    l = JSON.parse(a);
                if (l.session_key) {
                    t.push(l.session_key);
                    continue
                }
            } catch {}
            try {
                let a = await go.readdir(e.registrySessionsDir);
                for (let l of a)
                    if (!(!l.endsWith(".json") || l.startsWith(".") || l === "sessions.snapshot.json")) try {
                        let u = decodeURIComponent(l.slice(0, -5));
                        if (yo(u) === r) {
                            t.push(u);
                            let c = Lr.join(i, "state.json");
                            try {
                                let d = JSON.parse(await go.readFile(c, "utf8"));
                                d.session_key = u, await go.writeFile(c, JSON.stringify(d, null, 2) + `
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
