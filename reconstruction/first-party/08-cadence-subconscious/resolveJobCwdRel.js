// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: resolveJobCwdRel  (minified: Vve, daemon.pretty.js:63509)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveJobCwdRel(paths, cwdRelText) {
    let jobCwdRelText = normalizeJobCwdRelText(cwdRelText);
    if (!jobCwdRelText || Dg.isAbsolute(jobCwdRelText)) return null;
    let resolvedCwd = Dg.resolve(paths.workDir, jobCwdRelText);
    return isPathWithinDir(paths.workDir, resolvedCwd) ? {
        cwdRel: jobCwdRelText,
        cwd: resolvedCwd
    } : null
}
