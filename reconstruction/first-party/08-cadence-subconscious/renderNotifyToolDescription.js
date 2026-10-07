// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyToolDescription  (minified: hO, daemon.pretty.js:65247)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyToolDescription(e) {
    let {
        sessionKey: t,
        sessionContextKind: n
    } = e;
    switch (n ?? (isJobSessionKeyKind(t) ? "job" : "foreground")) {
        case "job":
            return qlt();
        case "meta":
            return Blt();
        case "foreground":
            return Qbe();
        case "system":
            return Vlt();
        default:
            return Qbe()
    }
}
