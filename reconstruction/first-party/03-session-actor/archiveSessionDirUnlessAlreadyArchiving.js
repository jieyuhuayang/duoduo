// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveSessionDirUnlessAlreadyArchiving  (minified: Kbe, daemon.pretty.js:65866)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveSessionDirUnlessAlreadyArchiving(e, t) {
    if (!tryMarkSessionArchiving(t)) return {
        archived: !1,
        reason: "archive_in_flight"
    };
    try {
        return await runWithSessionMutex(t, async () => ab(e, t)) ? {
            archived: !0
        } : {
            archived: !1,
            reason: "not_found"
        }
    } finally {
        clearSessionArchiving(t)
    }
}
