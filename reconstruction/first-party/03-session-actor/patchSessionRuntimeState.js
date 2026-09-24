// duoduo reconstruction — subsystem: 03-session-actor
// symbol: patchSessionRuntimeState  (minified: et, daemon.pretty.js:35564)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function patchSessionRuntimeState(e, t, n, r = {}) {
    let i = r.create === !0,
        o = !1;
    await runWithSessionMutex(t, async () => {
        if (assertSessionNotArchiving(t), !i && isSessionArchived(e, t)) {
            Re("[session] skipping runtime-state patch for tombstoned session", {
                sessionKey: t
            });
            return
        }
        let s = resolveSessionStatePath(e, t),
            a = {
                updated_at: new Date().toISOString()
            };
        try {
            let f = await ja.readFile(s, "utf8");
            a = JSON.parse(f)
        } catch {}
        let u = {},
            l = new Set;
        for (let [f, p] of Object.entries(n))
            if (p !== void 0) {
                if (p === null) {
                    l.add(f);
                    continue
                }
                u[f] = p
            } let c = Gd(u),
            d = {
                ...a,
                ...c,
                updated_at: new Date().toISOString()
            };
        for (let f of l) delete d[f];
        await Bt(s, d), o = !0
    }), o && jm(t, "state")
}
