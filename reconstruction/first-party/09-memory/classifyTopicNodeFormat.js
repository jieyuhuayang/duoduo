// duoduo reconstruction — subsystem: 09-memory
// symbol: classifyTopicNodeFormat  (minified: llt, daemon.pretty.js:66685)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyTopicNodeFormat(e) {
    for (let t of Bo(e)) {
        let n = /^# (Pattern|Lesson|Groove):/.exec(t);
        if (n) return n[1] === "Pattern" ? "legacy" : n[1] === "Lesson" ? "lesson" : "groove"
    }
    return "other"
}
