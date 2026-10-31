// duoduo reconstruction — subsystem: 09-memory
// symbol: renderBoardTemperatureSection  (minified: Pmt, daemon.pretty.js:69481)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): On top of that sits an activation report: it counts which memories are actually being read during real work, so the pipeline gets told about dead weight and unreachable material instead of accumulating both silently.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderBoardTemperatureSection(rows, truncatedCount) {
    let lines = ["", "board temperature (direct edges only -- each row is one [[slug]] occurrence and the", "touch count of the file behind it; no transitive attribution):", "line | slug | touches | resolves to"];
    rows.length === 0 && lines.push("(the board carries no [[slug]] pointers)");
    for (let row of rows) {
        let resolvesTo = row.twins.length === 0 ? "DANGLING -- no entities/ or topics/ file" : row.twins.map(twin => `${twin.rel}=${twin.touches}`).join(" ");
        lines.push(`L${row.line} | ${row.slug} | ${row.touches??"-"} | ${resolvesTo}`)
    }
    return truncatedCount > 0 && lines.push(`(+${truncatedCount} more rows, truncated at the board line budget)`), lines.push("direction: a hot line is holding its weight -- keep it, or sharpen it. A 0-touch line", "is half the evidence for retirement: check the line's fragments, and when they are", "also silent for this whole window, the default is retire, not preserve. Recent", "fragments overrule cold pointers -- this metric cannot see a line's direct in-context", "effect. A dangling pointer is claude-lint's business, not this report's."), lines
}
