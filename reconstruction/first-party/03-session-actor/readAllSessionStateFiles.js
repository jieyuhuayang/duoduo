// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionStateFiles  (minified: rh, daemon.pretty.js:35672)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.0 (high): feat(session): add readAllSessionStates() for scanning state.json files (c63683f)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionStateFiles(e) {
    let t = {},
        n;
    try {
        n = await qa.readdir(e.sessionsDir)
    } catch {
        return t
    }
    for (let r of n) {
        let i = JQe.join(e.sessionsDir, r, "state.json");
        try {
            let o = await qa.readFile(i, "utf8"),
                s = JSON.parse(o);
            s.session_key && (t[s.session_key] = s)
        } catch {}
    }
    return t
}
