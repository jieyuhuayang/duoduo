// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionSummaries  (minified: X1, daemon.pretty.js:35045)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionSummaries(e, t) {
    await _e(e.usageDir);
    let n;
    try {
        n = await Jk.readdir(e.usageDir)
    } catch {
        return {}
    }
    let r = {};
    for (let i of n) {
        if (!i.endsWith(".jsonl")) continue;
        let s = i.slice(0, -6),
            o = await readDrainRecords(e, s, t).catch(() => []);
        o.length > 0 && (r[s] = summarizeDrainRecords(o))
    }
    return r
}
