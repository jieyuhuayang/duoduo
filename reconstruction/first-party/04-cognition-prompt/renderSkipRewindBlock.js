// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: renderSkipRewindBlock  (minified: Amt, daemon.pretty.js:71876)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.0, v0.5.5 (maps/history_daemon.json)
// changelog v0.5.0 (high): Time annotations injected into `<time-context>`, `<job-tick>`, and `<skip-rewind>` prompt blocks now include a daemon wall-clock alongside the UTC timestamp
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
        a = formatLocalTimestampWithZone(n),
        u = a ? `Current time: ${r} (daemon: ${a}) (elapsed: ${s} since skip)` : `Current time: ${r} (elapsed: ${s} since skip)`;
    return [`<skip-rewind skipped_at="${t}">`, "You chose to skip your previous turn without replying to the user.", `Reason: "${e.reason}"`, "Anything your skipped turn produced was not delivered; the user did not see it.", u, "</skip-rewind>"].join(`
`)
}
