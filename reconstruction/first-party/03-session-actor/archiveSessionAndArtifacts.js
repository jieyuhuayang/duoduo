// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveSessionAndArtifacts  (minified: Ybe, daemon.pretty.js:65882)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveSessionAndArtifacts(e, t) {
    let n = [],
        r = hashSessionKey(t),
        i = () => new Date().toISOString().replace(/[:.]/g, "-"),
        o = await Nut(e, t, r),
        s = $ut(e.sessionsDir, "sessions", r),
        a = {
            state: "clear"
        },
        u = await runWithSessionMutex(t, async () => (a.state = await sb(e, t), a.state !== "clear" ? null : await ab(e, t)));
    if (u === null) return {
        archived: !1,
        reason: a.state === "unreadable" ? "unreadable" : "pending_work",
        archivedPaths: []
    };
    u && n.push(s);
    let l = await Wbe(Kn.join(e.varIngressDir, r), Kn.join(e.varDir, "ingress-archive"), r, i);
    l && n.push(l);
    let c = Kn.join(e.outboxDir, "replay", `${t}.jsonl`),
        d = Kn.join(e.varDir, "outbox-archive", "replay"),
        f = await Out(c, d, `${t}.jsonl`, i);
    f && n.push(f);
    let p = await Aut(e, t);
    if (n.push(...p), o) {
        let m = await Wbe(Kn.join(e.channelsDir, o), Kn.join(e.varDir, "channels-archive"), o, i);
        m && n.push(m)
    }
    return n.length === 0 ? {
        archived: !1,
        reason: "not_found",
        archivedPaths: []
    } : {
        archived: !0,
        archivedPaths: n
    }
}
