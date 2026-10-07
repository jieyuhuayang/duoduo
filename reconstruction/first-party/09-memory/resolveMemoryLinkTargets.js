// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryLinkTargets  (minified: ep, daemon.pretty.js:66790)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryLinkTargets(e) {
    let t = new Set;
    for (let n of scanWikiLinkOccurrences(e)) t.add(n.slug);
    return [...t].sort(compareStringsAscending)
}
