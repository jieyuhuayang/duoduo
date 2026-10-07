// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: migrateLegacyJobSessionKeys  (minified: Dke, daemon.pretty.js:69390)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function migrateLegacyJobSessionKeys(e) {
    let t = {
        migrated: 0,
        skipped: 0,
        collisions: 0,
        errors: 0
    };
    for (let n of ["active", "archive"]) {
        let r = Ake.join(e.jobsDir, n),
            i;
        try {
            i = await oA.readdir(r)
        } catch {
            continue
        }
        for (let o of i) {
            if (!o.endsWith(".md")) continue;
            let s = o.slice(0, -3);
            try {
                let a = await oA.readFile(Ake.join(r, o), "utf8"),
                    u = (0, sA.default)(a).data,
                    l = await Hpt(e, s, u, n);
                l === "migrated" ? t.migrated++ : l === "collision" ? t.collisions++ : t.skipped++
            } catch (a) {
                t.errors++, logWarnMessage("[job-key-migration] failed to migrate job session key", {
                    jobId: s,
                    scope: n,
                    error: a instanceof Error ? a.message : String(a)
                })
            }
        }
    }
    return (t.migrated > 0 || t.collisions > 0 || t.errors > 0) && logInfoMessage("[job-key-migration] job session keys migrated off owner_session", t), t
}
