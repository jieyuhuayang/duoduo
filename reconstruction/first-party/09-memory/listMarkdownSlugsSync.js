// duoduo reconstruction — subsystem: 09-memory
// symbol: listMarkdownSlugsSync  (minified: ou, daemon.pretty.js:66865)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.7.1 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMarkdownSlugsSync(e) {
    let t;
    try {
        t = CO.readdirSync(e)
    } catch (r) {
        return recordUnreadableMemoryPath(r), []
    }
    let n = [];
    for (let r of t) r.endsWith(".md") && n.push(r.slice(0, -3));
    return n.sort(compareStringsAscending), n
}
