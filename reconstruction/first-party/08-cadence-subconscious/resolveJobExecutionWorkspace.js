// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveJobExecutionWorkspace  (minified: Jve, daemon.pretty.js:63549)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.5 (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveJobExecutionWorkspace(paths, jobId, cwdRelText) {
    let runtimeWorkspaceDir = e6(paths, jobId);
    if (!cwdRelText || !cwdRelText.trim()) return {
        cwdRel: null,
        cwd: runtimeWorkspaceDir,
        runtimeWorkspaceDir,
        context: "system"
    };
    let jobCwdRel = resolveJobCwdRel(paths, cwdRelText);
    if (!jobCwdRel) throw new Error(`Job ${jobId} has invalid cwd_rel path`);
    return {
        cwdRel: jobCwdRel.cwdRel,
        cwd: jobCwdRel.cwd,
        runtimeWorkspaceDir,
        context: "workspace"
    }
}
