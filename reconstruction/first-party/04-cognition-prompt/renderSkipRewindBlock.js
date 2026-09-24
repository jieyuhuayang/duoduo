// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderSkipRewindBlock  (minified: Kdt, daemon.pretty.js:71574)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderSkipRewindBlock(e) {
    if (!e) return;
    let t = e.skipped_at,
        n = new Date,
        r = n.toISOString(),
        i = Date.now() - new Date(t).getTime(),
        o = Math.round(i / 6e4),
        s = o < 1 ? "<1m" : `${o}m`,
        a = kO(n),
        u = a ? `Current time: ${r} (daemon: ${a}) (elapsed: ${s} since skip)` : `Current time: ${r} (elapsed: ${s} since skip)`;
    return [`<skip-rewind skipped_at="${t}">`, "You chose to skip your previous turn without replying to the user.", `Reason: "${e.reason}"`, "Anything your skipped turn produced was not delivered; the user did not see it.", u, "</skip-rewind>"].join(`
`)
}
