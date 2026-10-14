// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: rebuildPlaylistRound  (minified: Pwe, daemon.pretty.js:66583)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 17 renamed — 3 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rebuildPlaylistRound(paths) {
    let subconsciousPartitions = await loadSubconsciousPartitions(paths),
        enabledPartitions = subconsciousPartitions.filter(partition => partition.schedule.enabled);
    if (enabledPartitions.length === 0 && subconsciousPartitions.length > 0) {
        let disabledNames = subconsciousPartitions.map(partition => partition.name);
        logWarnMessage("[playlist] all partitions are disabled, meta-session will idle", {
            totalPartitions: subconsciousPartitions.length,
            disabledPartitions: disabledNames,
            recoveryHint: "Edit partition CLAUDE.md files to set 'enabled: true' in frontmatter, or add new partitions"
        })
    }
    let source;
    try {
        source = await al.readFile(paths.subconsciousPlaylistPath, "utf8")
    } catch {
        source = `# Subconscious Playlist

## Current Round

## History
`
    }
    let parts = source.split(`
`),
        roundIndex = parts.findIndex(line => line.trim() === "## Current Round");
    if (roundIndex === -1) {
        let roundLines = enabledPartitions.map(partition => `- [ ] ${partition.name}`);
        parts.push("## Current Round", ...roundLines)
    } else {
        let length = parts.length;
        for (let i2 = roundIndex + 1; i2 < parts.length; i2++)
            if (parts[i2].trim().startsWith("## ") && parts[i2].trim() !== "## Current Round") {
                length = i2;
                break
            } let roundLines = enabledPartitions.map(partition => `- [ ] ${partition.name}`);
        parts.splice(roundIndex + 1, length - roundIndex - 1, ...roundLines, "")
    }
    return await writeFileAtomic(paths.subconsciousPlaylistPath, `${parts.join(`
`).replace(/\s+$/,"")}
`), logDebugMessage("[playlist] rebuilt round", {
        count: enabledPartitions.length,
        names: enabledPartitions.map(partition => partition.name)
    }), enabledPartitions.length
}
