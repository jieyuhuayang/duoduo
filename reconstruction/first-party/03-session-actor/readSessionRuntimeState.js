// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readSessionRuntimeState  (minified: rt, daemon.pretty.js:35664)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readSessionRuntimeState(e, t) {
    try {
        let n = await qa.readFile(resolveSessionStatePath(e, t), "utf8");
        return JSON.parse(n)
    } catch {
        return null
    }
}
