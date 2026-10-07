// duoduo reconstruction — subsystem: 09-memory
// symbol: normalizeSignalKindVersion  (minified: Nwe, daemon.pretty.js:66885)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.6 (medium): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeSignalKindVersion(e) {
    let t = e.trim();
    return /\.v\d+$/.test(t) ? t : `${t}.v1`
}
