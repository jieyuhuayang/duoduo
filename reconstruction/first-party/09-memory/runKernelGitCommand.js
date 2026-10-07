// duoduo reconstruction — subsystem: 09-memory
// symbol: runKernelGitCommand  (minified: pW, daemon.pretty.js:69240)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.2 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runKernelGitCommand(e, t, n) {
    try {
        return await Ike("git", buildSafeDirectoryGitArgs(e, t), {
            cwd: e,
            env: buildKernelGitEnv()
        })
    } catch (r) {
        if (n?.ignoreError) {
            let i = r;
            return {
                stdout: i.stdout ?? "",
                stderr: i.stderr ?? ""
            }
        }
        throw r
    }
}
