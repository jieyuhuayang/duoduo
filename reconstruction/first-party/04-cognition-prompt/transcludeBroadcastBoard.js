// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: transcludeBroadcastBoard  (minified: Uve, daemon.pretty.js:75465)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function transcludeBroadcastBoard(e) {
    let t = await qve(Bs.resolve(e), new Set);
    return {
        files: t,
        rendered: flt(t)
    }
}
