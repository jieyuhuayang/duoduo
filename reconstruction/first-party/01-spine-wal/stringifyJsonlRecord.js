// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: stringifyJsonlRecord  (minified: Bi, daemon.pretty.js:31932)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): Log lines containing U+2028 were shredded on read, because the line reader treated it as a line break and JSON does not.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stringifyJsonlRecord(record) {
    return JSON.stringify(record).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")
}
