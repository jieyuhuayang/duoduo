// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: extractPayloadMediaRefs  (minified: mJ, daemon.pretty.js:72875)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractPayloadMediaRefs(payload) {
    if (!isNonNullObject(payload)) return;
    let media = payload.media;
    if (!Array.isArray(media)) return;
    let refs = [];
    for (let entry of media) {
        if (!isNonNullObject(entry)) continue;
        let stringProperty = readStringProperty(entry, "path");
        stringProperty && refs.push({
            path: stringProperty,
            mime: readStringProperty(entry, "mime")
        })
    }
    return refs.length > 0 ? refs : void 0
}
