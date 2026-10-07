// duoduo reconstruction — subsystem: 03-session-actor
// symbol: rehydrateSessionState  (minified: Tae, daemon.pretty.js:32443)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rehydrateSessionState(e) {
    let t = [],
        n;
    try {
        n = await No.readdir(e.sessionsDir)
    } catch {
        return t
    }
    for (let r of n) {
        let i = Gr.join(e.sessionsDir, r);
        if (!(!(await No.stat(i).catch(() => null))?.isDirectory() || !await iYe(i))) {
            try {
                let a = await No.readFile(Gr.join(i, "state.json"), "utf8"),
                    u = JSON.parse(a);
                if (u.session_key) {
                    t.push(u.session_key);
                    continue
                }
            } catch {}
            try {
                let a = await No.readdir(e.registrySessionsDir);
                for (let u of a)
                    if (!(!u.endsWith(".json") || u.startsWith(".") || u === "sessions.snapshot.json")) try {
                        let l = decodeURIComponent(u.slice(0, -5));
                        if (hashSessionKey(l) === r) {
                            t.push(l);
                            let c = Gr.join(i, "state.json");
                            try {
                                let d = JSON.parse(await No.readFile(c, "utf8"));
                                d.session_key = l, await No.writeFile(c, JSON.stringify(d, null, 2) + `
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
