// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: listSortedAliasKeys  (minified: lA, daemon.pretty.js:69952)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.0 (medium): A model served through a gateway can now declare its real context window, its own endpoint and credential, and tier aliases, so a session on that model is no longer capped by whatever window the runtime assumed.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listSortedAliasKeys(e) {
    let t = Object.keys(e ?? {}).sort();
    return t.length === 0 ? null : t
}
