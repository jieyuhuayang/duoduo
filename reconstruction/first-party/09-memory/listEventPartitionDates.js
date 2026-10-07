// duoduo reconstruction — subsystem: 09-memory
// symbol: listEventPartitionDates  (minified: oft, daemon.pretty.js:68173)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): The activation window counts days on which someone actually interacted, so a quiet week no longer ages memories out.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listEventPartitionDates(e) {
    let t;
    try {
        t = FH.readdirSync(e)
    } catch (r) {
        return recordUnreadableMemoryPath(r), []
    }
    let n = [];
    for (let r of t) {
        let i = rft.exec(r);
        i && n.push(i[1])
    }
    return n.sort(), n
}
