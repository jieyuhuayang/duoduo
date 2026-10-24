// duoduo reconstruction — subsystem: 03-session-actor
// symbol: buildSessionInfoFromState  (minified: iy, daemon.pretty.js:74717)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.4.0, v0.5.0, v0.5.1, v0.5.2, v0.5.3, v0.5.6, v0.6.0, v0.8.0 (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildSessionInfoFromState(paths, sessionKey, state) {
    let plane = state?.plane ?? classifySessionPlane(sessionKey),
        defaultCwd = plane === "system" ? paths.kernelDir : paths.workDir,
        cwd = state?.cwd ?? defaultCwd,
        defaultPermissionProfile = plane === "system" ? "system_default" : "work_default";
    return {
        sessionId: state?.sdk_session_id,
        forkFrom: state?.pending_fork_to,
        model: state?.model,
        effort: state?.effort ?? void 0,
        cwd,
        plane,
        permissionProfile: state?.permission_profile ?? defaultPermissionProfile,
        settingSources: ["user", "project"]
    }
}
