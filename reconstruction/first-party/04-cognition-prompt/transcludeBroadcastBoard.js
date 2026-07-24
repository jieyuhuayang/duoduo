// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: transcludeBroadcastBoard  (minified: Pme, daemon.pretty.js:70977)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function transcludeBroadcastBoard(e) {
    let t = await $me(So.resolve(e), new Set);
    return {
        files: t,
        rendered: xXe(t)
    }
}
