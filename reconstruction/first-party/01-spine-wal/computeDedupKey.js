// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: computeDedupKey  (minified: qre, daemon.pretty.js:80811)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeDedupKey(e) {
    let t = e.dedup?.source_id;
    return t ? `${e.source?.kind??"unknown"}:${t}` : null
}
