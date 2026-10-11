// duoduo reconstruction — subsystem: 09-memory
// symbol: renderActivationReportHeader  (minified: uft, daemon.pretty.js:68277)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderActivationReportHeader(metrics) {
    let windowText = metrics.windowStart === null || metrics.windowEnd === null ? "no event partitions on disk" : `${metrics.windowStart} .. ${metrics.windowEnd}, ${metrics.partitionFiles} partition file(s), ${metrics.interactionDays} interaction day(s)`;
    return ["[activation-report]", `window: last ${metrics.windowDays} interaction days (days holding channel.message) of var/events (${windowText})`, `foreground tool events: ${metrics.foregroundToolEvents}`, `memory touches: ${metrics.memoryTouches} across ${metrics.filesTouched} of ${metrics.inventory} files in memory/{entities,topics}`, `foreground writes to the memory tree: ${metrics.foregroundWrites} (excluded from touches -- the tree is subconscious-owned, so a foreground write is suspicious, not warmth)`, `loss: expansion rate = ${MH(metrics.memoryTouches,metrics.foregroundToolEvents)} | live ratio = ${MH(metrics.filesTouched,metrics.inventory)} | dead weight = ${metrics.coldCount} cold files | wiring incompleteness = ${MH(metrics.hotOrphanCount,metrics.filesTouched)}`, "read every component against the denominators above: a quiet window voids this", "evidence entirely, and an active window with few touches indicts the recall loop", "rather than any single line or file."]
}
