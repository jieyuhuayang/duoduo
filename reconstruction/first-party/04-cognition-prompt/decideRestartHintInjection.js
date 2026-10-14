// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: decideRestartHintInjection  (minified: cwe, daemon.pretty.js:66094)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function decideRestartHintInjection(params) {
    return classifySessionKeyKind(params.sessionKey) !== "channel" ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "out-of-scope"
    } : params.lastEventAt === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: params.currentDaemonStartedAt,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "new-session"
    } : params.lastSeenDaemonStartedAt === void 0 ? {
        inject: !1,
        writeLastSeenAtEntry: params.currentDaemonStartedAt,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "grandfather"
    } : params.lastSeenDaemonStartedAt === params.currentDaemonStartedAt ? {
        inject: !1,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: void 0,
        stage: "same-daemon"
    } : {
        inject: !0,
        writeLastSeenAtEntry: void 0,
        writeLastSeenOnInjectSuccess: params.currentDaemonStartedAt,
        stage: "cross-restart"
    }
}
