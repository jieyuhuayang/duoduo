// duoduo reconstruction — subsystem: 09-memory
// symbol: ensureKernelGitRepo  (minified: R0e, daemon.pretty.js:71369)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.2.4, v0.5.2 (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function ensureKernelGitRepo(kernelDir) {
    if (!await isKernelGitToplevel(kernelDir)) {
        logInfoMessage("[memory-git] initializing git repo", {
            kernelDir
        }), await runKernelGitCommand(kernelDir, ["init"]), await jS.writeFile(w0e.join(kernelDir, ".gitignore"), k0e, "utf8"), await runKernelGitCommand(kernelDir, ["add", "."]), await runKernelGitCommand(kernelDir, ["commit", "-m", "memory: genesis"]), logInfoMessage("[memory-git] genesis commit created");
        return
    }
    await mergeKernelGitignoreEntries(kernelDir), logDebugMessage("[memory-git] existing repo detected, .gitignore synced")
}
