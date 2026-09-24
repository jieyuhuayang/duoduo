// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveAdditionalDirClaudeMdAutoload  (minified: OSe, daemon.pretty.js:70231)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveAdditionalDirClaudeMdAutoload(e, t, n, r) {
    if (e !== "claude" || !t?.content.trim() || !n || n.length === 0) return;
    let i = $Se(r);
    return n.some(s => $Se(s) !== i) ? void 0 : !1
}
