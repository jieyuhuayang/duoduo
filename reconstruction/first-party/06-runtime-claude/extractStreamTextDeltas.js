// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: extractStreamTextDeltas  (minified: uC, daemon.pretty.js:57147)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 7 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractStreamTextDeltas(event) {
    let chunks = [];
    if (!event || typeof event != "object") return chunks;
    let type = event.type;
    if (type === "content_block_delta") {
        let delta = event.delta;
        if (delta && typeof delta == "object") {
            let type = delta.type,
                text = delta.text;
            type === "text_delta" && typeof text == "string" && text.length > 0 && chunks.push({
                text,
                isDelta: !0
            })
        }
    } else if (type === "content_block_start") {
        let contentBlock = event.content_block;
        if (contentBlock && typeof contentBlock == "object") {
            let type = contentBlock.type,
                text = contentBlock.text;
            type === "text" && typeof text == "string" && text.length > 0 && chunks.push({
                text,
                isDelta: !1
            })
        }
    }
    return chunks
}
