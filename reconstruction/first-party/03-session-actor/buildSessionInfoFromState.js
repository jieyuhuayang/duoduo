// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionInfoFromState  (minified: Ig, daemon.pretty.js:72332)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSessionInfoFromState(e, t, n) {
    let r = n?.plane ?? classifySessionPlane(t),
        i = r === "system" ? e.kernelDir : e.workDir,
        o = n?.cwd ?? i,
        s = r === "system" ? "system_default" : "work_default";
    return {
        sessionId: n?.sdk_session_id,
        forkFrom: n?.pending_fork_to,
        model: n?.model,
        effort: n?.effort ?? void 0,
        cwd: o,
        plane: r,
        permissionProfile: n?.permission_profile ?? s,
        settingSources: ["user", "project"]
    }
}
