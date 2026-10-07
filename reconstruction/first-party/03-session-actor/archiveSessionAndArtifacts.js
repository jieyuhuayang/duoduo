// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveSessionAndArtifacts  (minified: hwe, daemon.pretty.js:66154)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// changelog v0.5.0 (high): `session.archive` RPC + `duoduo session archive <session_key>` CLI retired the old ad-hoc deletion paths. Archive moves the session dir to `var/sessions-archive/`; recovery is `mv` back.
// changelog v0.6.0 (high): Archiving now refuses unless the session is provably empty of pending work (checking every shape of in-flight work), ignores channel placeholder actors, and treats the archive marker as a real "about to disappear" signal.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveSessionAndArtifacts(e, t) {
    let n = [],
        r = hashSessionKey(t),
        i = () => new Date().toISOString().replace(/[:.]/g, "-"),
        o = await Pct(e, t, r),
        s = Rct(e.sessionsDir, "sessions", r),
        a = {
            state: "clear"
        },
        u = await runWithSessionMutex(t, async () => (a.state = await probeSessionPendingWork(e, t), a.state !== "clear" ? null : await moveSessionDirToArchive(e, t)));
    if (u === null) return {
        archived: !1,
        reason: a.state === "unreadable" ? "unreadable" : "pending_work",
        archivedPaths: []
    };
    u && n.push(s);
    let l = await cwe(er.join(e.varIngressDir, r), er.join(e.varDir, "ingress-archive"), r, i);
    l && n.push(l);
    let c = er.join(e.outboxDir, "replay", `${t}.jsonl`),
        d = er.join(e.varDir, "outbox-archive", "replay"),
        f = await Ict(c, d, `${t}.jsonl`, i);
    f && n.push(f);
    let p = await Tct(e, t);
    if (n.push(...p), o) {
        let m = await cwe(er.join(e.channelsDir, o), er.join(e.varDir, "channels-archive"), o, i);
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
