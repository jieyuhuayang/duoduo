// duoduo reconstruction — subsystem: 03-session-actor
// symbol: archiveSessionAndArtifacts  (minified: cke, daemon.pretty.js:68237)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.6.0 (maps/history_daemon.json)
// locals: 15 renamed — 0 from the code at the binding (rule), 15 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (high): `session.archive` RPC + `duoduo session archive <session_key>` CLI retired the old ad-hoc deletion paths. Archive moves the session dir to `var/sessions-archive/`; recovery is `mv` back.
// changelog v0.6.0 (high): Archiving now refuses unless the session is provably empty of pending work (checking every shape of in-flight work), ignores channel placeholder actors, and treats the archive marker as a real "about to disappear" signal.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function archiveSessionAndArtifacts(paths, sessionKey) {
    let archivedPaths = [],
        sessionHash = hashSessionKey(sessionKey),
        timestamp = () => new Date().toISOString().replace(/[:.]/g, "-"),
        channelId = await Imt(paths, sessionKey, sessionHash),
        archivedSessionPath = xmt(paths.sessionsDir, "sessions", sessionHash),
        probe = {
            state: "clear"
        },
        moveResult = await runWithSessionMutex(sessionKey, async () => (probe.state = await probeSessionPendingWork(paths, sessionKey), probe.state !== "clear" ? null : await moveSessionDirToArchive(paths, sessionKey)));
    if (moveResult === null) return {
        archived: !1,
        reason: probe.state === "unreadable" ? "unreadable" : "pending_work",
        archivedPaths: []
    };
    moveResult && archivedPaths.push(archivedSessionPath);
    let ingressArchivePath = await oke(er.join(paths.varIngressDir, sessionHash), er.join(paths.varDir, "ingress-archive"), sessionHash, timestamp);
    ingressArchivePath && archivedPaths.push(ingressArchivePath);
    let replayPath = er.join(paths.outboxDir, "replay", `${sessionKey}.jsonl`),
        replayArchiveDir = er.join(paths.varDir, "outbox-archive", "replay"),
        replayArchivePath = await Emt(replayPath, replayArchiveDir, `${sessionKey}.jsonl`, timestamp);
    replayArchivePath && archivedPaths.push(replayArchivePath);
    let extraArchivedPaths = await Rmt(paths, sessionKey);
    if (archivedPaths.push(...extraArchivedPaths), channelId) {
        let channelArchivePath = await oke(er.join(paths.channelsDir, channelId), er.join(paths.varDir, "channels-archive"), channelId, timestamp);
        channelArchivePath && archivedPaths.push(channelArchivePath)
    }
    return archivedPaths.length === 0 ? {
        archived: !1,
        reason: "not_found",
        archivedPaths: []
    } : {
        archived: !0,
        archivedPaths
    }
}
