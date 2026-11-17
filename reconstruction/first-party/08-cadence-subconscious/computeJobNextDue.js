// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computeJobNextDue  (minified: Sve, daemon.pretty.js:62774)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 1 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeJobNextDue(e, t, n, r, i) {
    let scheduleNextDue = computeScheduleNextDue(e, t, n, r);
    if (typeof i == "string" && i.length > 0) {
        let s = new Date(i).getTime();
        if (Number.isFinite(s)) return (e === "once" || e.startsWith("@in ")) && t === null ? {
            kind: "at",
            ms: s
        } : scheduleNextDue.kind === "now" ? scheduleNextDue : scheduleNextDue.kind === "never" ? {
            kind: "at",
            ms: s
        } : {
            kind: "at",
            ms: Math.min(s, scheduleNextDue.ms)
        }
    }
    return scheduleNextDue
}
