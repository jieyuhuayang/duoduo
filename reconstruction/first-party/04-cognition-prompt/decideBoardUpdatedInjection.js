// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: decideBoardUpdatedInjection  (minified: MEe, daemon.pretty.js:71648)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function decideBoardUpdatedInjection(params) {
    return params.currentBoardHash === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "no-board"
    } : params.lastSeenBoardHash === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: params.currentBoardHash,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "first-seen"
    } : params.lastSeenBoardHash === params.currentBoardHash ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "unchanged"
    } : {
        inject: !0,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: params.currentBoardHash,
        stage: "changed"
    }
}
