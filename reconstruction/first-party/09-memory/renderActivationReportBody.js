// duoduo reconstruction — subsystem: 09-memory
// symbol: renderActivationReportBody  (minified: Cmt, daemon.pretty.js:69498)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderActivationReportBody(metrics, temperature, truncatedCount, hotOrphans) {
    return [...renderActivationReportHeader(metrics), ...renderBoardTemperatureSection(temperature, truncatedCount), ...renderHotOrphansSection(hotOrphans, metrics.hotOrphanCount)].join(`
`) + `
`
}
