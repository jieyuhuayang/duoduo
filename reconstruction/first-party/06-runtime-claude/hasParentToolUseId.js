// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: hasParentToolUseId  (minified: Mf, daemon.pretty.js:55021)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasParentToolUseId(e) {
    if (!e || typeof e != "object") return !1;
    let t = e.parent_tool_use_id;
    return typeof t == "string" && t.length > 0
}
