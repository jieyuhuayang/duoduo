// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readPartitionInboxEntries  (minified: Iwe, daemon.pretty.js:66626)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.3, v0.8.0 (maps/history_daemon.json)
// locals: 17 renamed — 2 from the code at the binding (rule), 15 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readPartitionInboxEntries(paths, partition) {
    let inboxDir = partitionInboxDir(paths, partition),
        dirEntries;
    try {
        dirEntries = await al.readdir(inboxDir, {
            withFileTypes: !0
        })
    } catch {
        return {
            entries: []
        }
    }
    let fileNames = dirEntries.filter(dirEntry => dirEntry.isFile() && !dirEntry.name.startsWith(".") && (dirEntry.name.endsWith(".pending") || dirEntry.name.endsWith(".json"))).map(dirEntry => dirEntry.name),
        sortedNames = (await Promise.all(fileNames.map(async fileName => {
            try {
                let stats = await al.stat(RO.join(inboxDir, fileName));
                return {
                    name: fileName,
                    mtimeMs: stats.mtimeMs
                }
            } catch {
                return null
            }
        }))).filter(item => item !== null).sort((a, b) => a.mtimeMs - b.mtimeMs || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).map(item => item.name);
    if (sortedNames.length === 0) return {
        entries: []
    };
    let entries = [];
    for (let fileName of sortedNames) try {
        let content = await al.readFile(RO.join(inboxDir, fileName), "utf8");
        entries.push({
            file: fileName,
            message: content.trim()
        })
    } catch {}
    return logDebugMessage("[playlist] read partition inbox", {
        partition,
        files: sortedNames.length,
        entriesEmitted: entries.length
    }), {
        entries
    }
}
