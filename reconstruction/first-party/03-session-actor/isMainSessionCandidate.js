// duoduo reconstruction — subsystem: 03-session-actor
// symbol: isMainSessionCandidate  (minified: xue, daemon.pretty.js:32689)
// name: INFERRED — upstream's own spelling, confirmed against the published source @openduo/protocol@0.8.6 main-session.ts (maps/published_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.7 (medium): **Main session.** One channel session holds the alias `main`; Notify takes `main` as an explicit target and resolves it at each delivery.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isMainSessionCandidate(e) {
    return classifySessionKey(e.session_key) === "channel" && typeof e.display_name == "string" && e.display_name.trim() === Hn
}
