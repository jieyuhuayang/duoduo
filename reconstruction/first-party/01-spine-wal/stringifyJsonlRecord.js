// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: stringifyJsonlRecord  (minified: Bi, daemon.pretty.js:31829)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stringifyJsonlRecord(e) {
    return JSON.stringify(e).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")
}
