// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: extractStreamThinkingText  (minified: J$, daemon.pretty.js:55093)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractStreamThinkingText(e) {
    let t = [];
    if (!e || typeof e != "object") return t;
    let n = e.type;
    if (n === "content_block_start") {
        let r = e.content_block;
        if (r && typeof r == "object") {
            let i = r.type,
                o = r.thinking;
            i === "thinking" && typeof o == "string" && o.length > 0 && t.push(o)
        }
    } else if (n === "content_block_delta") {
        let r = e.delta;
        if (r && typeof r == "object") {
            let i = r.type,
                o = r.thinking;
            i === "thinking_delta" && typeof o == "string" && o.length > 0 && t.push(o)
        }
    }
    return t
}
