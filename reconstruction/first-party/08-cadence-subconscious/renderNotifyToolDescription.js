// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderNotifyToolDescription  (minified: A$, daemon.pretty.js:64989)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNotifyToolDescription(e) {
    let {
        sessionKey: t,
        sessionContextKind: n
    } = e;
    switch (n ?? (J_e(t) ? "job" : "foreground")) {
        case "job":
            return Zat();
        case "meta":
            return Gat();
        case "foreground":
            return D_e();
        case "system":
            return Kat();
        default:
            return D_e()
    }
}
