// duoduo reconstruction — subsystem: 09-memory
// symbol: listMarkdownSlugsSync  (minified: au, daemon.pretty.js:68948)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.7.1 (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMarkdownSlugsSync(dirPath) {
    let entries;
    try {
        entries = JO.readdirSync(dirPath)
    } catch (err) {
        return recordUnreadableMemoryPath(err), []
    }
    let slugs = [];
    for (let fileName of entries) fileName.endsWith(".md") && slugs.push(fileName.slice(0, -3));
    return slugs.sort(compareStringsAscending), slugs
}
