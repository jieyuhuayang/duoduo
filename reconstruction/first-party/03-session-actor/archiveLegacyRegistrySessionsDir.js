// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveLegacyRegistrySessionsDir  (minified: Gke, daemon.pretty.js:69662)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 26 renamed — 2 from the code at the binding (rule), 24 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): `var/registry/sessions/` is no longer read on the hot path and is archived to `var/registry.legacy.<ts>/` on first post-upgrade start
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveLegacyRegistrySessionsDir(paths) {
    let registrySessionsDir = paths.registrySessionsDir,
        entries;
    try {
        entries = await or.readdir(registrySessionsDir)
    } catch {
        return !1
    }
    if (entries.length === 0) {
        try {
            await or.rmdir(registrySessionsDir)
        } catch {}
        return !1
    }
    let backfilled = 0,
        skipped = 0;
    for (let fileName of entries) {
        if (!fileName.endsWith(".json") || fileName === "sessions.snapshot.json" || fileName === ".initialized") continue;
        let sessionKey;
        try {
            sessionKey = decodeURIComponent(fileName.slice(0, -5))
        } catch {
            continue
        }
        let filePath = sr.join(registrySessionsDir, fileName),
            raw;
        try {
            raw = await or.readFile(filePath, "utf8")
        } catch {
            continue
        }
        let legacyRecord;
        try {
            legacyRecord = JSON.parse(raw)
        } catch {
            continue
        }
        let seed = {
            session_key: sessionKey
        };
        for (let field of ["cwd", "plane", "permission_profile", "created_at", "last_event_id", "last_event_at"]) {
            let value = legacyRecord[field];
            typeof value == "string" && value.length > 0 && (seed[field] = value)
        }
        let sessionHash = nmt.createHash("sha256").update(sessionKey).digest("hex"),
            sessionDir = sr.join(paths.sessionsDir, sessionHash),
            statePath = sr.join(sessionDir, "state.json"),
            archiveRoot = sr.join(paths.varDir, "sessions-archive"),
            alreadyArchived = !1;
        try {
            let dirEntries = await or.readdir(archiveRoot);
            for (let archivedName of dirEntries)
                if (archivedName === sessionHash || archivedName.startsWith(`${sessionHash}.`)) {
                    alreadyArchived = !0;
                    break
                }
        } catch {}
        if (alreadyArchived) {
            skipped++;
            continue
        }
        let existingState = null;
        try {
            existingState = JSON.parse(await or.readFile(statePath, "utf8"))
        } catch {
            existingState = null
        }
        let merged = {
            ...seed,
            ...existingState ?? {}
        };
        merged.session_key = sessionKey, merged.updated_at = new Date().toISOString(), delete merged.status, delete merged.idle_since, delete merged.health;
        try {
            await ensureDirectoryExists(sessionDir), await or.writeFile(statePath, JSON.stringify(merged, null, 2) + `
`, "utf8"), backfilled++
        } catch {
            skipped++
        }
    }
    let timestamp = new Date().toISOString().replace(/[:.]/g, "-"),
        legacyRoot = sr.join(paths.varDir, `registry.legacy.${timestamp}`),
        legacySessionsDir = sr.join(legacyRoot, "sessions");
    await ensureDirectoryExists(legacyRoot);
    let destination = legacySessionsDir;
    try {
        await or.access(destination), destination = `${legacySessionsDir}.${process.pid}`
    } catch {}
    return await or.rename(registrySessionsDir, destination), logWarnMessage(`[init] archived legacy var/registry/sessions/ (${entries.length} entries, backfilled=${backfilled}, skipped=${skipped}) → ${destination}. Phase 3 of session-state-refactor: session metadata now lives in var/sessions/<hash>/state.json only.`), !0
}
