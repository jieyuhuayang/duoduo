// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: extractSdkMessageTextChunks  (minified: H$, daemon.pretty.js:55032)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 4 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractSdkMessageTextChunks(message) {
    let chunks = [],
        content = message.content ?? message.message?.content ?? void 0;
    if (Array.isArray(content))
        for (let block of content) {
            if (!block || typeof block != "object") continue;
            let blockType = typeof block.type == "string" ? (block.type ?? "").toLowerCase() : "",
                delta = block.delta,
                text = block.text;
            if (typeof delta == "string" && delta.length > 0) chunks.push({
                text: delta,
                isDelta: !0
            });
            else if (typeof text == "string" && text.length > 0) {
                let isDelta = blockType.includes("delta") || blockType.includes("partial");
                chunks.push({
                    text,
                    isDelta
                })
            }
        }
    let delta = message.delta;
    typeof delta == "string" && delta.length > 0 && chunks.push({
        text: delta,
        isDelta: !0
    });
    let text = message.text;
    return typeof text == "string" && text.length > 0 && chunks.push({
        text,
        isDelta: !1
    }), chunks
}
