// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolveSessionsArchiveRoot  (minified: oYe, daemon.pretty.js:32368)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.5 (high): **Archive session tombstone** (#44): `ManageJob(archive)` now moves the session directory to `var/sessions-archive/`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveSessionsArchiveRoot(paths) {
    return Gr.join(paths.varDir, "sessions-archive")
}
