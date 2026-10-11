// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readAllSessionSummaries  (minified: dq, daemon.pretty.js:37150)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.2 (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readAllSessionSummaries(paths, options) {
    await ensureDirectoryExists(paths.usageDir);
    let entries;
    try {
        entries = await SI.readdir(paths.usageDir)
    } catch {
        return {}
    }
    let summaries = {};
    for (let fileName of entries) {
        if (!fileName.endsWith(".jsonl")) continue;
        let sessionKey = fileName.slice(0, -6),
            summary = await aggregateSessionDrainSummary(paths, sessionKey, options).catch(createEmptyUsageSummary);
        summary.total_drains > 0 && (summaries[sessionKey] = summary)
    }
    return summaries
}
