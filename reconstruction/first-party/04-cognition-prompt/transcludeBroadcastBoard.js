// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: transcludeBroadcastBoard  (minified: S_e, daemon.pretty.js:73801)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function transcludeBroadcastBoard(e) {
    let t = await k_e(qs.resolve(e), new Set);
    return {
        files: t,
        rendered: Vit(t)
    }
}
