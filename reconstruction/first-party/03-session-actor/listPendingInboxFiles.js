// duoduo reconstruction — subsystem: 03-session-actor
// symbol: listPendingInboxFiles  (minified: $b, daemon.pretty.js:32414)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listPendingInboxFiles(e) {
    try {
        return (await No.readdir(e)).filter(t => t.endsWith(".pending"))
    } catch (t) {
        if (t.code === "ENOENT") return [];
        throw t
    }
}
