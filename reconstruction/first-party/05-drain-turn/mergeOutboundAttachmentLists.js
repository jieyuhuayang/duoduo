// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: mergeOutboundAttachmentLists  (minified: Qxe, daemon.pretty.js:72775)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): Runtime image output delivery no longer duplicates attachments.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeOutboundAttachmentLists(...lists) {
    let map = new Map;
    for (let list of lists)
        if (list)
            for (let attachment of list) typeof attachment.path != "string" || !attachment.path || typeof attachment.mime != "string" || !attachment.mime || map.set(`${attachment.path}\0${attachment.mime}`, {
                path: attachment.path,
                mime: attachment.mime
            });
    return map.size > 0 ? Array.from(map.values()) : void 0
}
