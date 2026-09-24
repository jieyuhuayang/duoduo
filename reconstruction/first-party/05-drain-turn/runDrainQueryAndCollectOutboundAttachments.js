// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: runDrainQueryAndCollectOutboundAttachments  (minified: HSe, daemon.pretty.js:72392)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runDrainQueryAndCollectOutboundAttachments(e, t, n, r) {
    try {
        let i = await runDrainTurnWithResumeFallback(e, t, n, r),
            o = await readPendingOutboundAttachments(e, t),
            s = await Mft(e, t, i.attachments),
            a = lke(s, o);
        return await xO(e, t), {
            sdkResult: i,
            outboundAttachments: a
        }
    } catch (i) {
        try {
            await xO(e, t)
        } catch {}
        throw i
    }
}
