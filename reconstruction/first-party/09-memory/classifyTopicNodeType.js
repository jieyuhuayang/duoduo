// duoduo reconstruction — subsystem: 09-memory
// symbol: classifyTopicNodeType  (minified: clt, daemon.pretty.js:66693)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function classifyTopicNodeType(e) {
    let t = null;
    for (let i of Bo(e))
        if (/^\*\*Type\*\*:/i.test(i)) {
            t = i.toLowerCase();
            break
        } if (t === null) return "unknown";
    let n = /behavioral|workflow|failure|groove|discipline|protocol|procedural|operational pattern|pattern/.test(t);
    return /research|thesis|supply-chain|-chain|frame|surface|chokepoint/.test(t) ? "domain" : n ? "behavioral" : "unknown"
}
