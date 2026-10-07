// duoduo reconstruction — subsystem: 09-memory
// symbol: classifyTopicNodeFormat  (minified: rdt, daemon.pretty.js:66957)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyTopicNodeFormat(e) {
    for (let t of splitLinesDropTrailingEmpty(e)) {
        let n = /^# (Pattern|Lesson|Groove):/.exec(t);
        if (n) return n[1] === "Pattern" ? "legacy" : n[1] === "Lesson" ? "lesson" : "groove"
    }
    return "other"
}
