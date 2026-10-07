// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runDrainQueryAndCollectOutboundAttachments  (minified: Dxe, daemon.pretty.js:72694)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.7, v0.6.0 (maps/history_daemon.json)
// changelog v0.5.0 (medium): Runtime image output delivery no longer duplicates attachments.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runDrainQueryAndCollectOutboundAttachments(e, t, n, r) {
    try {
        let i = await runDrainTurnWithResumeFallback(e, t, n, r),
            o = await readPendingOutboundAttachments(e, t),
            s = await bht(e, t, i.attachments),
            a = mergeOutboundAttachmentLists(s, o);
        return await clearPendingOutboundAttachments(e, t), {
            sdkResult: i,
            outboundAttachments: a
        }
    } catch (i) {
        try {
            await clearPendingOutboundAttachments(e, t)
        } catch {}
        throw i
    }
}
