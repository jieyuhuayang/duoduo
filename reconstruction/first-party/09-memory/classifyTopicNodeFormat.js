// duoduo reconstruction — subsystem: 09-memory
// symbol: classifyTopicNodeFormat  (minified: tht, daemon.pretty.js:69040)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyTopicNodeFormat(text) {
    for (let line of splitLinesDropTrailingEmpty(text)) {
        let match = /^# (Pattern|Lesson|Groove):/.exec(line);
        if (match) return match[1] === "Pattern" ? "legacy" : match[1] === "Lesson" ? "lesson" : "groove"
    }
    return "other"
}
