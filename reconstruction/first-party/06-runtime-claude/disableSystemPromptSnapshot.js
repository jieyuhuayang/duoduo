// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: disableSystemPromptSnapshot  (minified: Prt, daemon.pretty.js:55202)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function disableSystemPromptSnapshot(e) {
    return typeof e == "string" || Array.isArray(e) ? {
        type: "custom",
        prompt: e,
        snapshot: !1
    } : e && typeof e == "object" ? {
        ...e,
        snapshot: !1
    } : e
}
