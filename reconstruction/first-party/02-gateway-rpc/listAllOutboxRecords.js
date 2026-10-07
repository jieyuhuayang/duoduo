// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listAllOutboxRecords  (minified: Qb, daemon.pretty.js:36115)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listAllOutboxRecords(e) {
    let t = [];
    try {
        t = await Rn.readdir(e.outboxDir)
    } catch {
        return []
    }
    let n = [];
    for (let r of t) {
        let i = Lr.join(e.outboxDir, r);
        try {
            if (!(await Rn.stat(i)).isDirectory()) continue
        } catch {
            continue
        }
        let o = await Pce(e, r);
        n.push(...o)
    }
    return n
}
