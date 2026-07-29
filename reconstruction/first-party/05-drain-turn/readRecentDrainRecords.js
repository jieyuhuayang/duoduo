// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readRecentDrainRecords  (minified: nVe, daemon.pretty.js:35080)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readRecentDrainRecords(e, t) {
    await _e(e.usageDir);
    let n;
    try {
        n = await Jk.readdir(e.usageDir)
    } catch {
        return []
    }
    let r = [];
    for (let i of n) {
        if (!i.endsWith(".jsonl")) continue;
        let s = i.slice(0, -6),
            o = await readDrainRecords(e, s).catch(() => []);
        r.push(...o)
    }
    return r.sort((i, s) => new Date(s.drain_started_at).getTime() - new Date(i.drain_started_at).getTime()), r.slice(0, t)
}
