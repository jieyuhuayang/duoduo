// duoduo reconstruction — subsystem: 09-memory
// symbol: findNewestFragmentMtimeMs  (minified: Omt, daemon.pretty.js:69619)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 3 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one consolidates them into intuition.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findNewestFragmentMtimeMs(memoryDir) {
    let newestMs = null,
        walk = dirPath => {
            let entries;
            try {
                entries = Lke.readdirSync(dirPath, {
                    withFileTypes: !0
                })
            } catch (err) {
                recordUnreadableMemoryPath(err);
                return
            }
            for (let entry of entries) {
                if (entry.name.startsWith(".")) continue;
                let entryPath = Fke.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    walk(entryPath);
                    continue
                }
                if (entry.isFile()) try {
                    let stats = Lke.statSync(entryPath);
                    (newestMs === null || stats.mtimeMs > newestMs) && (newestMs = stats.mtimeMs)
                } catch (err) {
                    recordUnreadableMemoryPath(err)
                }
            }
        };
    return walk(Fke.join(memoryDir, "fragments")), newestMs
}
