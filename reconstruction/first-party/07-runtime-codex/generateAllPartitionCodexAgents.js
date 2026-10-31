// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: generateAllPartitionCodexAgents  (minified: $gt, daemon.pretty.js:71043)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 2 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function generateAllPartitionCodexAgents(paths) {
    let {
        generatePartitionCodexAgents
    } = await Promise.resolve().then(() => (dEe(), cEe)), entries;
    try {
        entries = await lr.readdir(paths.subconsciousDir, {
            withFileTypes: !0
        })
    } catch {
        return
    }
    for (let entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "inbox") continue;
        let partitionDir = cr.join(paths.subconsciousDir, entry.name);
        try {
            let result = await generatePartitionCodexAgents(partitionDir);
            if (result.errors.length > 0)
                for (let error of result.errors) console.warn(`[runtime-init] codex-agents-generator error for ${error.path}: ${error.reason}`)
        } catch (err) {
            console.warn(`[runtime-init] codex-agents-generator failed for ${partitionDir}: ${err instanceof Error?err.message:String(err)}`)
        }
    }
}
