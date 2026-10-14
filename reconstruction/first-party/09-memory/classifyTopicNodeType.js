// duoduo reconstruction — subsystem: 09-memory
// symbol: classifyTopicNodeType  (minified: sdt, daemon.pretty.js:66966)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyTopicNodeType(text) {
    let typeLine = null;
    for (let line of splitLinesDropTrailingEmpty(text))
        if (/^\*\*Type\*\*:/i.test(line)) {
            typeLine = line.toLowerCase();
            break
        } if (typeLine === null) return "unknown";
    let isBehavioral = /behavioral|workflow|failure|groove|discipline|protocol|procedural|operational pattern|pattern/.test(typeLine);
    return /research|thesis|supply-chain|-chain|frame|surface|chokepoint/.test(typeLine) ? "domain" : isBehavioral ? "behavioral" : "unknown"
}
