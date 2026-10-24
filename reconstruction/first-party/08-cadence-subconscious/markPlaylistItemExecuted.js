// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: markPlaylistItemExecuted  (minified: BO, daemon.pretty.js:68647)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 10 renamed — 1 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function markPlaylistItemExecuted(paths, partitionName, now = new Date) {
    let source;
    try {
        source = await al.readFile(paths.subconsciousPlaylistPath, "utf8")
    } catch {
        return
    }
    let parts = source.split(`
`),
        marked = !1;
    for (let i2 = 0; i2 < parts.length; i2++) parts[i2].trim() === `- [ ] ${partitionName}` && !marked && (parts[i2] = parts[i2].replace("- [ ]", "- [x]"), marked = !0);
    if (!marked) return;
    let historyLine = `- ${now.toISOString()} executed=${partitionName}`,
        historyIndex = parts.findIndex(line => line.trim() === "## History");
    historyIndex !== -1 ? parts.splice(historyIndex + 1, 0, historyLine) : parts.push("", "## History", historyLine), await writeFileAtomic(paths.subconsciousPlaylistPath, `${parts.join(`
`).replace(/\s+$/,"")}
`)
}
