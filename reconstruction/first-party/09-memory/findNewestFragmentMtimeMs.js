// duoduo reconstruction — subsystem: 09-memory
// symbol: findNewestFragmentMtimeMs  (minified: fft, daemon.pretty.js:68420)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): one consolidates them into intuition.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function findNewestFragmentMtimeMs(e) {
    let t = null,
        n = r => {
            let i;
            try {
                i = vSe.readdirSync(r, {
                    withFileTypes: !0
                })
            } catch (o) {
                recordUnreadableMemoryPath(o);
                return
            }
            for (let o of i) {
                if (o.name.startsWith(".")) continue;
                let s = wSe.join(r, o.name);
                if (o.isDirectory()) {
                    n(s);
                    continue
                }
                if (o.isFile()) try {
                    let a = vSe.statSync(s);
                    (t === null || a.mtimeMs > t) && (t = a.mtimeMs)
                } catch (a) {
                    recordUnreadableMemoryPath(a)
                }
            }
        };
    return n(wSe.join(e, "fragments")), t
}
