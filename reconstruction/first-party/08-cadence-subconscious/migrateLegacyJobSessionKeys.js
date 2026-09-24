// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: migrateLegacyJobSessionKeys  (minified: Hwe, daemon.pretty.js:69099)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
        let r = Bwe.join(e.jobsDir, n),
            i;
        try {
            i = await pO.readdir(r)
        } catch {
            continue
        }
        for (let o of i) {
            if (!o.endsWith(".md")) continue;
            let s = o.slice(0, -3);
            try {
                let a = await pO.readFile(Bwe.join(r, o), "utf8"),
                    u = (0, mO.default)(a).data,
                    l = await udt(e, s, u, n);
                l === "migrated" ? t.migrated++ : l === "collision" ? t.collisions++ : t.skipped++
            } catch (a) {
                t.errors++, Z("[job-key-migration] failed to migrate job session key", {
                    jobId: s,
                    scope: n,
                    error: a instanceof Error ? a.message : String(a)
                })
            }
        }
    }
    return (t.migrated > 0 || t.collisions > 0 || t.errors > 0) && te("[job-key-migration] job session keys migrated off owner_session", t), t
}
