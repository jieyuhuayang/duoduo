// duoduo reconstruction — subsystem: 09-memory
// symbol: renderActivationReportBody  (minified: dft, daemon.pretty.js:68299)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// changelog v0.8.0 (medium): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderActivationReportBody(e, t, n, r) {
    return [...renderActivationReportHeader(e), ...renderBoardTemperatureSection(t, n), ...renderHotOrphansSection(r, e.hotOrphanCount)].join(`
`) + `
`
}
