// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readRecentDrainRecords  (minified: $et, daemon.pretty.js:37184)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 9 renamed — 0 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readRecentDrainRecords(paths, limit) {
    await ensureDirectoryExists(paths.usageDir);
    let fileNames;
    try {
        fileNames = await SI.readdir(paths.usageDir)
    } catch {
        return []
    }
    let records = [];
    for (let fileName of fileNames) {
        if (!fileName.endsWith(".jsonl")) continue;
        let sessionKey = fileName.slice(0, -6),
            sessionRecords = await readDrainRecords(paths, sessionKey).catch(() => []);
        records.push(...sessionRecords)
    }
    return records.sort((a, b) => new Date(b.drain_started_at).getTime() - new Date(a.drain_started_at).getTime()), records.slice(0, limit)
}
