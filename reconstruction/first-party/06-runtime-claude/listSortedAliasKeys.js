// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: listSortedAliasKeys  (minified: lA, daemon.pretty.js:69952)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listSortedAliasKeys(e) {
    let t = Object.keys(e ?? {}).sort();
    return t.length === 0 ? null : t
}
