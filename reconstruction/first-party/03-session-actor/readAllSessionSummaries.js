// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionSummaries  (minified: aU, daemon.pretty.js:36855)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionSummaries(e, t) {
    await Oe(e.usageDir);
    let n;
    try {
        n = await BR.readdir(e.usageDir)
    } catch {
        return {}
    }
    let r = {};
    for (let i of n) {
        if (!i.endsWith(".jsonl")) continue;
        let o = i.slice(0, -6),
            s = await Lle(e, o, t).catch(VR);
        s.total_drains > 0 && (r[o] = s)
    }
    return r
}
