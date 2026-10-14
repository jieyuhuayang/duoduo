// duoduo reconstruction — subsystem: 03-session-actor
// symbol: formatViewSessionsListLine  (minified: Qbe, daemon.pretty.js:64905)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): `ManageSession` is now `ViewSessions`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatViewSessionsListLine(session) {
    let parts = [`kind ${session.kind}`];
    return session.display_name && parts.push(`alias "${session.display_name}"`), session.orphan && parts.push("orphan — job archived or recreated, will not run"), `- ${session.session_key} (${parts.join("; ")})${session.isCaller?" (you)":""}`
}
