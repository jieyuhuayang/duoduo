// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionStateFiles  (minified: nh, daemon.pretty.js:35672)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 2 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.0 (high): feat(session): add readAllSessionStates() for scanning state.json files (c63683f)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionStateFiles(paths) {
    let statesByKey = {},
        entries;
    try {
        entries = await qa.readdir(paths.sessionsDir)
    } catch {
        return statesByKey
    }
    for (let sessionHash of entries) {
        let statePath = KQe.join(paths.sessionsDir, sessionHash, "state.json");
        try {
            let content = await qa.readFile(statePath, "utf8"),
                parsed = JSON.parse(content);
            parsed.session_key && (statesByKey[parsed.session_key] = parsed)
        } catch {}
    }
    return statesByKey
}
