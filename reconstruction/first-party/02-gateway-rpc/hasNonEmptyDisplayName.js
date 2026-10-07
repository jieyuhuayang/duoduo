// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: hasNonEmptyDisplayName  (minified: Zf, daemon.pretty.js:64850)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.4 (medium): `duoduo session alias <key> "<name>"` — give a session a human label so it is legible in `list` and usable as a wake target.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasNonEmptyDisplayName(e) {
    return typeof e.display_name == "string" && e.display_name.trim().length > 0
}
