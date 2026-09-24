// duoduo reconstruction — subsystem: 03-session-actor
// symbol: updateSessionDisplayName  (minified: ole, daemon.pretty.js:35514)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function updateSessionDisplayName(e, t, n) {
    assertSessionNotArchiving(t);
    let r = null;
    return await runWithSessionMutex(t, async () => {
        let i = resolveSessionMetaPath(e, t),
            o;
        try {
            o = await ja.readFile(i, "utf8")
        } catch {
            return
        }
        let s = (0, kb.default)(o, _r),
            a = s.data;
        if (a.session_key !== t || typeof a.kind != "string" || a.display_name !== void 0 && typeof a.display_name != "string") return;
        let u = n === null ? "" : n.trim(),
            l = {
                ...a,
                session_key: t,
                kind: a.kind,
                display_name: u.length > 0 ? u : void 0
            };
        await Dt(i, kb.default.stringify(s.content, Gd(l))), r = Gd(l)
    }), r && jm(t, "meta"), r
}
