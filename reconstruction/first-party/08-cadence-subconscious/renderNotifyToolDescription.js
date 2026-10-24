// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyToolDescription  (minified: CO, daemon.pretty.js:67330)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0 (maps/history_daemon.json)
// locals: 3 renamed — 2 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyToolDescription(ctx) {
    let {
        sessionKey,
        sessionContextKind
    } = ctx;
    switch (sessionContextKind ?? (isJobSessionKeyKind(sessionKey) ? "job" : "foreground")) {
        case "job":
            return zpt();
        case "meta":
            return Upt();
        case "foreground":
            return Gwe();
        case "system":
            return qpt();
        default:
            return Gwe()
    }
}
