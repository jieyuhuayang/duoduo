// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: migrateLegacyJobSessionKeys  (minified: $0e, daemon.pretty.js:71473)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 11 renamed — 3 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function migrateLegacyJobSessionKeys(paths) {
    let summary = {
        migrated: 0,
        skipped: 0,
        collisions: 0,
        errors: 0
    };
    for (let scope of ["active", "archive"]) {
        let dir = T0e.join(paths.jobsDir, scope),
            fileNames;
        try {
            fileNames = await wA.readdir(dir)
        } catch {
            continue
        }
        for (let fileName of fileNames) {
            if (!fileName.endsWith(".md")) continue;
            let jobId = fileName.slice(0, -3);
            try {
                let content = await wA.readFile(T0e.join(dir, fileName), "utf8"),
                    data = (0, SA.default)(content).data,
                    outcome = await Byt(paths, jobId, data, scope);
                outcome === "migrated" ? summary.migrated++ : outcome === "collision" ? summary.collisions++ : summary.skipped++
            } catch (err) {
                summary.errors++, logWarnMessage("[job-key-migration] failed to migrate job session key", {
                    jobId,
                    scope,
                    error: err instanceof Error ? err.message : String(err)
                })
            }
        }
    }
    return (summary.migrated > 0 || summary.collisions > 0 || summary.errors > 0) && logInfoMessage("[job-key-migration] job session keys migrated off owner_session", summary), summary
}
