// duoduo reconstruction — subsystem: 03-session-actor
// symbol: assertJobWorkspaceUsable  (minified: Y_e, daemon.pretty.js:61454)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function assertJobWorkspaceUsable(job) {
    if (job.context !== "workspace") return;
    let cwdStats = await zC.stat(job.cwd).catch(() => null);
    if (!cwdStats || !cwdStats.isDirectory()) throw new Error(`Job workspace '${job.cwdRel}' no longer exists. cwd_rel points to a directory that must exist with a CLAUDE.md context file; it was present when the job was created but is now missing.`);
    let claudeMdPath = $c.join(job.cwd, "CLAUDE.md"),
        claudeMdStats = await zC.stat(claudeMdPath).catch(() => null);
    if (!claudeMdStats || !claudeMdStats.isFile()) throw new Error(`Job workspace '${job.cwdRel}' is missing CLAUDE.md. cwd_rel requires a CLAUDE.md context file so the job session has project-level instructions; it was present when the job was created but is now missing.`)
}
