// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: isImageGenerationItemType  (minified: dbe, daemon.pretty.js:62772)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isImageGenerationItemType(e) {
    let t = e.type;
    if (typeof t != "string") return !1;
    let n = t.toLowerCase().replace(/[_-]/g, "");
    return n === "imagegenerationend" || n === "imagegeneration" || n === "imagegenerationcall"
}
