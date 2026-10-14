// duoduo reconstruction — subsystem: 09-memory
// symbol: mergeContiguousHourRanges  (minified: uSe, daemon.pretty.js:67916)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.8 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.8 (medium): It now works one bounded day at a time, picked by a program-computed gap check (`duoduo memory check` reports the chosen gap)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeContiguousHourRanges(hours) {
    let sorted = [...hours].sort((a, b) => a - b),
        ranges = [];
    for (let hour of sorted) {
        let last = ranges[ranges.length - 1];
        last && hour === last[1] + 1 ? last[1] = hour : ranges.push([hour, hour])
    }
    return ranges
}
