// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: createSpineEvent  (minified: nn, daemon.pretty.js:33302)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSpineEvent(fields, now = new Date) {
    return {
        ...fields,
        id: generateSpineEventId(),
        ts: now.toISOString()
    }
}
