// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: computeJobNextRunAt  (minified: xve, daemon.pretty.js:62864)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.9 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 2 from the code at the binding (rule), 0 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeJobNextRunAt(e, t, n = new Date) {
    let jobNextDue = computeJobNextDue(e.cron, resolveJobScheduleAnchor(e.cron, t), n, e.created_at, t.run_at ?? null);
    if (jobNextDue.kind === "never") return null;
    if (jobNextDue.kind === "now") return n.toISOString();
    let date = new Date(jobNextDue.ms);
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
