// duoduo reconstruction — subsystem: 03-session-actor
// symbol: resolvePreemptFromCommandText  (minified: DG, daemon.pretty.js:90630)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePreemptFromCommandText(e) {
    let t = e?.trim();
    return !t || !t.startsWith("/") ? "allow" : t.split(/\s+/, 1)[0]?.toLowerCase() === "/cancel" ? "force" : "never"
}
