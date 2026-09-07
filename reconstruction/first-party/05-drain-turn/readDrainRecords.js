// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readDrainRecords  (minified: hu, daemon.pretty.js:36124)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readDrainRecords(e, t, n) {
    let r = drainRecordPath(e, t),
        i = [];
    try {
        let o = U3e(r);
        for await (let s of ua(o)) if (s.trim()) try {
            let a = JSON.parse(s);
            a?.id && a?.session_key && (!n || new Date(a.drain_started_at) >= n) && i.push(a)
        } catch {}
    } catch (o) {
        if (o.code !== "ENOENT") throw o
    }
    return i
}
