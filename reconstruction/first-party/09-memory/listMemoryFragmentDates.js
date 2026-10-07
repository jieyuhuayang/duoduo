// duoduo reconstruction — subsystem: 09-memory
// symbol: listMemoryFragmentDates  (minified: Mdt, daemon.pretty.js:67767)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMemoryFragmentDates(e) {
    let t;
    try {
        t = au.readdirSync(zc.join(e, "fragments"), {
            withFileTypes: !0
        })
    } catch (r) {
        return {
            dates: [],
            readFault: recordUnreadableUnlessMissing(r)
        }
    }
    let n = [];
    for (let r of t) r.isDirectory() && Bg(r.name) && n.push(r.name);
    return {
        dates: n.sort(),
        readFault: !1
    }
}
