// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: normalizeDirPathForCompare  (minified: FEe, daemon.pretty.js:71716)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeDirPathForCompare(e) {
    let t = oy.resolve(e);
    return process.platform === "win32" ? t.toLowerCase() : t
}
