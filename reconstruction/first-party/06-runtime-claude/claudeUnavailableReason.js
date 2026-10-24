// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: claudeUnavailableReason  (minified: Dw, daemon.pretty.js:57422)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.3 (medium): Hosts can expose whichever runtimes are actually installed and authenticated.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function claudeUnavailableReason() {
    return Ec?.ok === !1 ? Ec.reason : void 0
}
