// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: decideRestartHintInjection  (minified: Bbe, daemon.pretty.js:65821)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function decideRestartHintInjection(e) {
    return classifySessionKeyKind(e.sessionKey) !== "channel" ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "out-of-scope"
    } : e.lastEventAt === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: e.currentDaemonStartedAt,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "new-session"
    } : e.lastSeenDaemonStartedAt === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: e.currentDaemonStartedAt,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "grandfather"
    } : e.lastSeenDaemonStartedAt === e.currentDaemonStartedAt ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "same-daemon"
    } : {
        inject: !0,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: e.currentDaemonStartedAt,
        stage: "cross-restart"
    }
}
