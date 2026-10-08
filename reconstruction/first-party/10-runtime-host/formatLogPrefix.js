// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: formatLogPrefix  (minified: z8e, daemon.pretty.js:32033)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatLogPrefix(e, t = new Date) {
    return `${t.toISOString()} [${e.toUpperCase()}]`
}
