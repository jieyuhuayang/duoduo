// duoduo reconstruction — subsystem: 09-memory
// symbol: mergeKernelGitignoreEntries  (minified: zyt, daemon.pretty.js:71378)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 0 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function mergeKernelGitignoreEntries(kernelDir) {
    let gitignorePath = w0e.join(kernelDir, ".gitignore"),
        existing = "";
    try {
        existing = await jS.readFile(gitignorePath, "utf8")
    } catch {}
    let existingEntries = new Set(existing.split(`
`).map(line => line.trim()).filter(entry => entry.length > 0)),
        missingEntries = Lyt.filter(entry => !existingEntries.has(entry));
    if (missingEntries.length === 0) return;
    let appendText = (existing.endsWith(`
`) || existing.length === 0 ? "" : `
`) + missingEntries.join(`
`) + `
`;
    await jS.writeFile(gitignorePath, existing + appendText, "utf8"), logDebugMessage("[memory-git] merged .gitignore entries", {
        added: missingEntries
    })
}
