// duoduo reconstruction — subsystem: 09-memory
// symbol: listEventPartitionDates  (minified: cct, daemon.pretty.js:67882)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listEventPartitionDates(e) {
    let t;
    try {
        t = F6.readdirSync(e)
    } catch (r) {
        return recordUnreadableMemoryPath(r), []
    }
    let n = [];
    for (let r of t) {
        let i = uct.exec(r);
        i && n.push(i[1])
    }
    return n.sort(), n
}
