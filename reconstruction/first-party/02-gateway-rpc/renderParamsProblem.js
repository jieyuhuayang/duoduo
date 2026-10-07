// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: renderParamsProblem  (minified: Dm, daemon.pretty.js:31617)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// since: v0.8.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderParamsProblem(e, t) {
    if (/[.!?]$/.test(t)) return t;
    let n = Object.hasOwn(kb, e) ? kb[e] : null,
        r = n === null ? "" : ` Accepted keys for ${e}: ${n.join(", ")}.`;
    return `${t}. Nothing was ${C8e[e]??"done"}.${r} Send it again with that fixed.`
}
