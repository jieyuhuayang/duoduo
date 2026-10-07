// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractPayloadMediaRefs  (minified: DW, daemon.pretty.js:71676)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractPayloadMediaRefs(e) {
    if (!isNonNullObject(e)) return;
    let t = e.media;
    if (!Array.isArray(t)) return;
    let n = [];
    for (let r of t) {
        if (!isNonNullObject(r)) continue;
        let i = readStringProperty(r, "path");
        i && n.push({
            path: i,
            mime: readStringProperty(r, "mime")
        })
    }
    return n.length > 0 ? n : void 0
}
