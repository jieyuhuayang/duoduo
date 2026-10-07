// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: textKeysProblem  (minified: lae, daemon.pretty.js:31609)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.4 system.ts (maps/published_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function textKeysProblem(e, t, n) {
    for (let r of t)
        if (!Object.hasOwn(e, r)) return `Missing key "${r}"`;
    for (let r of [...t, ...n])
        if (Object.hasOwn(e, r) && !isNonEmptyText(e[r])) return `"${r}" must be non-empty text`;
    return null
}
