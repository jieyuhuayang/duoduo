// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readNewestMtimeRecursive  (minified: JN, daemon.pretty.js:88255)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readNewestMtimeRecursive(dir) {
    let dirEntries;
    try {
        dirEntries = await Pk.readdir(dir, {
            withFileTypes: !0
        })
    } catch {
        return 0
    }
    let newestMtimeMs = 0;
    try {
        let stats = await Pk.stat(dir);
        stats.mtimeMs > newestMtimeMs && (newestMtimeMs = stats.mtimeMs)
    } catch {}
    for (let dirEntry of dirEntries) {
        let entryPath = Cy.join(dir, dirEntry.name);
        if (dirEntry.isDirectory()) {
            let newestMtimeRecursive = await readNewestMtimeRecursive(entryPath);
            newestMtimeRecursive > newestMtimeMs && (newestMtimeMs = newestMtimeRecursive)
        } else if (dirEntry.isFile() || dirEntry.isSymbolicLink()) try {
            let stats = await Pk.stat(entryPath);
            stats.mtimeMs > newestMtimeMs && (newestMtimeMs = stats.mtimeMs)
        } catch {}
    }
    return newestMtimeMs
}
