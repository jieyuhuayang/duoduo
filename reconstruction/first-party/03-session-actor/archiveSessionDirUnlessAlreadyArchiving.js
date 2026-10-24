// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveSessionDirUnlessAlreadyArchiving  (minified: lke, daemon.pretty.js:68221)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveSessionDirUnlessAlreadyArchiving(paths, sessionKey) {
    if (!tryMarkSessionArchiving(sessionKey)) return {
        archived: !1,
        reason: "archive_in_flight"
    };
    try {
        return await runWithSessionMutex(sessionKey, async () => moveSessionDirToArchive(paths, sessionKey)) ? {
            archived: !0
        } : {
            archived: !1,
            reason: "not_found"
        }
    } finally {
        clearSessionArchiving(sessionKey)
    }
}
