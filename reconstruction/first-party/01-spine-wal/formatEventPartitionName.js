// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: formatEventPartitionName  (minified: Sm, daemon.pretty.js:31997)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatEventPartitionName(e) {
    return `${e.toISOString().slice(0,10)}.jsonl`
}
