// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: decideBoardUpdatedInjection  (minified: TSe, daemon.pretty.js:70158)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function decideBoardUpdatedInjection(e) {
    return e.currentBoardHash === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "no-board"
    } : e.lastSeenBoardHash === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: e.currentBoardHash,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "first-seen"
    } : e.lastSeenBoardHash === e.currentBoardHash ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "unchanged"
    } : {
        inject: !0,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: e.currentBoardHash,
        stage: "changed"
    }
}
