// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: resolveAdditionalDirClaudeMdAutoload  (minified: Sxe, daemon.pretty.js:70522)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (medium): Before v0.5.2 the directive was silently inert under `additionalDirectories`, so anything referenced there did not reach the system prompt.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveAdditionalDirClaudeMdAutoload(e, t, n, r) {
    if (e !== "claude" || !t?.content.trim() || !n || n.length === 0) return;
    let i = wxe(r);
    return n.some(s => wxe(s) !== i) ? void 0 : !1
}
