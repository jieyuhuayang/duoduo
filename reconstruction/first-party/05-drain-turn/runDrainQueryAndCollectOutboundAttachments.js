// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runDrainQueryAndCollectOutboundAttachments  (minified: $Ee, daemon.pretty.js:74777)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.7, v0.6.0 (maps/history_daemon.json)
// locals: 9 renamed — 3 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): Runtime image output delivery no longer duplicates attachments.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runDrainQueryAndCollectOutboundAttachments(paths, sessionKey, sdk, request) {
    try {
        let sdkResult = await runDrainTurnWithResumeFallback(paths, sessionKey, sdk, request),
            pendingOutboundAttachments = await readPendingOutboundAttachments(paths, sessionKey),
            resultAttachments = await ybt(paths, sessionKey, sdkResult.attachments),
            outboundAttachmentLists = mergeOutboundAttachmentLists(resultAttachments, pendingOutboundAttachments);
        return await clearPendingOutboundAttachments(paths, sessionKey), {
            sdkResult,
            outboundAttachments: outboundAttachmentLists
        }
    } catch (err) {
        try {
            await clearPendingOutboundAttachments(paths, sessionKey)
        } catch {}
        throw err
    }
}
