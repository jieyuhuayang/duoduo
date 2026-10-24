// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: isImageGenerationItemType  (minified: swe, daemon.pretty.js:64855)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 1 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isImageGenerationItemType(item) {
    let type = item.type;
    if (typeof type != "string") return !1;
    let normalizedType = type.toLowerCase().replace(/[_-]/g, "");
    return normalizedType === "imagegenerationend" || normalizedType === "imagegeneration" || normalizedType === "imagegenerationcall"
}
