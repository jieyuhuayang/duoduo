// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: transcludeBroadcastBoard  (minified: WEe, daemon.pretty.js:82197)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function transcludeBroadcastBoard(e) {
    let t = await JEe(ha.resolve(e), new Set);
    return {
        files: t,
        rendered: hgt(t)
    }
}
