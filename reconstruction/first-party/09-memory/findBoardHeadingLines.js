// duoduo reconstruction — subsystem: 09-memory
// symbol: findBoardHeadingLines  (minified: Ift, daemon.pretty.js:68547)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findBoardHeadingLines(e) {
    let t = [],
        n = e.split(`
`),
        r = !1;
    for (let i = 0; i < n.length; i += 1) {
        if (Rft.test(n[i])) {
            r = !r;
            continue
        }
        r || Eft.test(n[i]) && t.push({
            line: i + 1,
            text: n[i]
        })
    }
    return t
}
