// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyToolDescription  (minified: AO, daemon.pretty.js:66542)
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
            return oft();
        case "meta":
            return sft();
        case "foreground":
            return _we();
        case "system":
            return aft();
        default:
            return _we()
    }
}
