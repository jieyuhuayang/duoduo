// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: mergeOutboundAttachmentLists  (minified: Qxe, daemon.pretty.js:72775)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.5.0 (medium): Runtime image output delivery no longer duplicates attachments.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function mergeOutboundAttachmentLists(...e) {
    let t = new Map;
    for (let n of e)
        if (n)
            for (let r of n) typeof r.path != "string" || !r.path || typeof r.mime != "string" || !r.mime || t.set(`${r.path}\0${r.mime}`, {
                path: r.path,
                mime: r.mime
            });
    return t.size > 0 ? Array.from(t.values()) : void 0
}
