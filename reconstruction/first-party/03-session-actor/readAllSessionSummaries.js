// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionSummaries  (minified: j1, daemon.pretty.js:36006)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionSummaries(e, t) {
    await xe(e.usageDir);
    let n;
    try {
        n = await x0.readdir(e.usageDir)
    } catch {
        return {}
    }
    let r = {};
    for (let i of n) {
        if (!i.endsWith(".jsonl")) continue;
        let o = i.slice(0, -6),
            s = await readDrainRecords(e, o, t).catch(() => []);
        s.length > 0 && (r[o] = summarizeDrainRecords(s))
    }
    return r
}
