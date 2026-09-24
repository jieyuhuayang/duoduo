// duoduo reconstruction — subsystem: 09-memory
// symbol: renderActivationReportHeader  (minified: pct, daemon.pretty.js:67986)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderActivationReportHeader(e) {
    let t = e.windowStart === null || e.windowEnd === null ? "no event partitions on disk" : `${e.windowStart} .. ${e.windowEnd}, ${e.partitionFiles} partition file(s), ${e.interactionDays} interaction day(s)`;
    return ["[activation-report]", `window: last ${e.windowDays} interaction days (days holding channel.message) of var/events (${t})`, `foreground tool events: ${e.foregroundToolEvents}`, `memory touches: ${e.memoryTouches} across ${e.filesTouched} of ${e.inventory} files in memory/{entities,topics}`, `foreground writes to the memory tree: ${e.foregroundWrites} (excluded from touches -- the tree is subconscious-owned, so a foreground write is suspicious, not warmth)`, `loss: expansion rate = ${M6(e.memoryTouches,e.foregroundToolEvents)} | live ratio = ${M6(e.filesTouched,e.inventory)} | dead weight = ${e.coldCount} cold files | wiring incompleteness = ${M6(e.hotOrphanCount,e.filesTouched)}`, "read every component against the denominators above: a quiet window voids this", "evidence entirely, and an active window with few touches indicts the recall loop", "rather than any single line or file."]
}
