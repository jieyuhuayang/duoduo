// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: stringifyJsonlRecord  (minified: Bi, daemon.pretty.js:31932)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (high): Log lines containing U+2028 were shredded on read, because the line reader treated it as a line break and JSON does not.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stringifyJsonlRecord(e) {
    return JSON.stringify(e).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")
}
