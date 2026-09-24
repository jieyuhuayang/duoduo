// duoduo reconstruction — subsystem: 09-memory
// symbol: isKernelGitToplevel  (minified: idt, daemon.pretty.js:68982)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isKernelGitToplevel(e) {
    try {
        let {
            stdout: t
        } = await jwe("git", zwe(e, ["rev-parse", "--show-toplevel"]), {
            cwd: e,
            env: buildKernelGitEnv()
        }), n = await Gw.realpath(t.trim()), r = await Gw.realpath(e);
        return n === r
    } catch {
        return !1
    }
}
