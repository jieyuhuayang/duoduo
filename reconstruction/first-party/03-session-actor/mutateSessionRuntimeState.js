// duoduo reconstruction — subsystem: 03-session-actor
// symbol: mutateSessionRuntimeState  (minified: Kd, daemon.pretty.js:35601)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mutateSessionRuntimeState(e, t, n) {
    let r = !1;
    await runWithSessionMutex(t, async () => {
        if (assertSessionNotArchiving(t), isSessionArchived(e, t)) {
            Re("[session] skipping runtime-state mutate for tombstoned session", {
                sessionKey: t
            });
            return
        }
        let i = fs(e, t),
            o = {
                updated_at: new Date().toISOString()
            };
        try {
            let c = await ja.readFile(i, "utf8");
            o = JSON.parse(c)
        } catch {}
        let s = n(o),
            a = {},
            u = new Set;
        for (let [c, d] of Object.entries(s))
            if (d !== void 0) {
                if (d === null) {
                    u.add(c);
                    continue
                }
                a[c] = d
            } let l = {
            ...o,
            ...Gd(a),
            updated_at: new Date().toISOString()
        };
        for (let c of u) delete l[c];
        await Bt(i, l), r = !0
    }), r && jm(t, "state")
}
