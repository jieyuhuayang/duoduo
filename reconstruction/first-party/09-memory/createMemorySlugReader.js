// duoduo reconstruction — subsystem: 09-memory
// symbol: createMemorySlugReader  (minified: Lc, daemon.pretty.js:67138)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 3 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createMemorySlugReader(memoryDirs) {
    return slug => {
        if (!isSafeMemorySlug(slug)) return null;
        let memoryFile = readMemoryFileSyncOrNull(SH.join(memoryDirs.topicsDir, `${slug}.md`)),
            memoryFile2 = readMemoryFileSyncOrNull(SH.join(memoryDirs.entitiesDir, `${slug}.md`)),
            parts = [];
        if (memoryFile !== null && parts.push(memoryFile), memoryFile2 !== null && parts.push(memoryFile2), parts.length > 0) {
            let memoryFile = readMemoryFileSyncOrNull(SH.join(memoryDirs.effectivenessDir, `${slug}.md`));
            memoryFile !== null && parts.push(memoryFile)
        }
        return parts.length > 0 ? parts.join(`
`) : null
    }
}
