// duoduo reconstruction — subsystem: 09-memory
// symbol: formatSlugLinkLocations  (minified: vft, daemon.pretty.js:68505)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatSlugLinkLocations(e) {
    return e.map(t => `[[${t.slug}]] at L${t.line}`).join(", ")
}
