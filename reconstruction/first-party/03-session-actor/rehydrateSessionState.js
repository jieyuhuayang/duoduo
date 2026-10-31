// duoduo reconstruction — subsystem: 03-session-actor
// symbol: rehydrateSessionState  (minified: Jue, daemon.pretty.js:33641)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 12 renamed — 4 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.0 (high): feat(session): reader fallback chain and session_key backfill (3fd1b1e)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rehydrateSessionState(paths) {
    let sessionKeys = [],
        entries;
    try {
        entries = await Lo.readdir(paths.sessionsDir)
    } catch {
        return sessionKeys
    }
    for (let sessionHash of entries) {
        let sessionDir = ei.join(paths.sessionsDir, sessionHash);
        if (!(!(await Lo.stat(sessionDir).catch(() => null))?.isDirectory() || !await bXe(sessionDir))) {
            try {
                let content = await Lo.readFile(ei.join(sessionDir, "state.json"), "utf8"),
                    parsed = JSON.parse(content);
                if (parsed.session_key) {
                    sessionKeys.push(parsed.session_key);
                    continue
                }
            } catch {}
            try {
                let dirEntries = await Lo.readdir(paths.registrySessionsDir);
                for (let registryFile of dirEntries)
                    if (!(!registryFile.endsWith(".json") || registryFile.startsWith(".") || registryFile === "sessions.snapshot.json")) try {
                        let sessionKey = decodeURIComponent(registryFile.slice(0, -5));
                        if (hashSessionKey(sessionKey) === sessionHash) {
                            sessionKeys.push(sessionKey);
                            let statePath = ei.join(sessionDir, "state.json");
                            try {
                                let parsed = JSON.parse(await Lo.readFile(statePath, "utf8"));
                                parsed.session_key = sessionKey, await Lo.writeFile(statePath, JSON.stringify(parsed, null, 2) + `
`)
                            } catch {}
                            break
                        }
                    } catch {}
            } catch {}
        }
    }
    return sessionKeys
}
