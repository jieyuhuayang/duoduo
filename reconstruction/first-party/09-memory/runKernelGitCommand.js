// duoduo reconstruction — subsystem: 09-memory
// symbol: runKernelGitCommand  (minified: tH, daemon.pretty.js:68949)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runKernelGitCommand(e, t, n) {
    try {
        return await jwe("git", zwe(e, t), {
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
