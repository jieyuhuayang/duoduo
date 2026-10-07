// duoduo reconstruction — subsystem: 09-memory
// symbol: ensureKernelGitRepo  (minified: Cke, daemon.pretty.js:69286)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureKernelGitRepo(e) {
    if (!await isKernelGitToplevel(e)) {
        logInfoMessage("[memory-git] initializing git repo", {
            kernelDir: e
        }), await runKernelGitCommand(e, ["init"]), await ES.writeFile(Rke.join(e, ".gitignore"), Tke, "utf8"), await runKernelGitCommand(e, ["add", "."]), await runKernelGitCommand(e, ["commit", "-m", "memory: genesis"]), logInfoMessage("[memory-git] genesis commit created");
        return
    }
    await mergeKernelGitignoreEntries(e), logDebugMessage("[memory-git] existing repo detected, .gitignore synced")
}
