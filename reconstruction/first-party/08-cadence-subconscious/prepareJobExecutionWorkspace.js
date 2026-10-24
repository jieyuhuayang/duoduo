// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: prepareJobExecutionWorkspace  (minified: Gve, daemon.pretty.js:63566)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 1 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function prepareJobExecutionWorkspace(paths, jobId, cwdRelText) {
    let runtimeWorkspaceDir = e6(paths, jobId);
    if (await ensureDirectoryExists(runtimeWorkspaceDir), !cwdRelText || !cwdRelText.trim()) {
        let systemWorkspace = {
            cwdRel: null,
            cwd: runtimeWorkspaceDir,
            runtimeWorkspaceDir,
            context: "system"
        };
        return await Hve(paths, jobId, systemWorkspace), systemWorkspace
    }
    let jobCwdRel = resolveJobCwdRel(paths, cwdRelText);
    if (!jobCwdRel) throw new Error(`Job ${jobId} has invalid cwd_rel path`);
    let cwdStat = await nO.stat(jobCwdRel.cwd).catch(() => null);
    if (!cwdStat || !cwdStat.isDirectory()) throw new Error(`Job ${jobId}: cwd_rel '${jobCwdRel.cwdRel}' does not exist. The directory must be created with a CLAUDE.md context file before creating the job.`);
    let claudeMdPath = Dg.join(jobCwdRel.cwd, "CLAUDE.md"),
        claudeMdStat = await nO.stat(claudeMdPath).catch(() => null);
    if (!claudeMdStat || !claudeMdStat.isFile()) throw new Error(`Job ${jobId}: cwd_rel '${jobCwdRel.cwdRel}' is missing CLAUDE.md. A CLAUDE.md context file is required so the job session has project-level instructions.`);
    let workspaceInfo = {
        cwdRel: jobCwdRel.cwdRel,
        cwd: jobCwdRel.cwd,
        runtimeWorkspaceDir,
        context: "workspace"
    };
    return await Hve(paths, jobId, workspaceInfo), workspaceInfo
}
