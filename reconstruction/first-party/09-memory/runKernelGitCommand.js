// duoduo reconstruction — subsystem: 09-memory
// symbol: runKernelGitCommand  (minified: GW, daemon.pretty.js:71323)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2 (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runKernelGitCommand(kernelDir, args, options) {
    try {
        return await S0e("git", buildSafeDirectoryGitArgs(kernelDir, args), {
            cwd: kernelDir,
            env: buildKernelGitEnv()
        })
    } catch (err) {
        if (options?.ignoreError) {
            let execError = err;
            return {
                stdout: execError.stdout ?? "",
                stderr: execError.stderr ?? ""
            }
        }
        throw err
    }
}
