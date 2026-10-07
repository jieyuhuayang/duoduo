// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: parseToolUseBlockStart  (minified: G$, daemon.pretty.js:55115)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function parseToolUseBlockStart(e) {
    if (!e || typeof e != "object" || e.type !== "content_block_start") return null;
    let n = e.index;
    if (typeof n != "number") return null;
    let r = e.content_block;
    if (!r || typeof r != "object" || r.type !== "tool_use") return null;
    let o = r.id,
        s = r.name;
    return typeof o != "string" || typeof s != "string" ? null : {
        index: n,
        toolUseId: o,
        toolName: s
    }
}
