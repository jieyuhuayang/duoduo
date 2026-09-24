// duoduo reconstruction — subsystem: 09-memory
// symbol: ensureKernelGitRepo  (minified: Uwe, daemon.pretty.js:68995)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureKernelGitRepo(e) {
    if (!await isKernelGitToplevel(e)) {
        te("[memory-git] initializing git repo", {
            kernelDir: e
        }), await runKernelGitCommand(e, ["init"]), await Gw.writeFile(Mwe.join(e, ".gitignore"), Lwe, "utf8"), await runKernelGitCommand(e, ["add", "."]), await runKernelGitCommand(e, ["commit", "-m", "memory: genesis"]), te("[memory-git] genesis commit created");
        return
    }
    await mergeKernelGitignoreEntries(e), Re("[memory-git] existing repo detected, .gitignore synced")
}
