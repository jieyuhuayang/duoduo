// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: rebuildPlaylistRound  (minified: ave, daemon.pretty.js:66310)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function rebuildPlaylistRound(e) {
    let t = await loadSubconsciousPartitions(e),
        n = t.filter(s => s.schedule.enabled);
    if (n.length === 0 && t.length > 0) {
        let s = t.map(a => a.name);
        Z("[playlist] all partitions are disabled, meta-session will idle", {
            totalPartitions: t.length,
            disabledPartitions: s,
            recoveryHint: "Edit partition CLAUDE.md files to set 'enabled: true' in frontmatter, or add new partitions"
        })
    }
    let r;
    try {
        r = await Gu.readFile(e.subconsciousPlaylistPath, "utf8")
    } catch {
        r = `# Subconscious Playlist

## Current Round

## History
`
    }
    let i = r.split(`
`),
        o = i.findIndex(s => s.trim() === "## Current Round");
    if (o === -1) {
        let s = n.map(a => `- [ ] ${a.name}`);
        i.push("## Current Round", ...s)
    } else {
        let s = i.length;
        for (let u = o + 1; u < i.length; u++)
            if (i[u].trim().startsWith("## ") && i[u].trim() !== "## Current Round") {
                s = u;
                break
            } let a = n.map(u => `- [ ] ${u.name}`);
        i.splice(o + 1, s - o - 1, ...a, "")
    }
    return await Dt(e.subconsciousPlaylistPath, `${i.join(`
`).replace(/\s+$/,"")}
`), Re("[playlist] rebuilt round", {
        count: n.length,
        names: n.map(s => s.name)
    }), n.length
}
