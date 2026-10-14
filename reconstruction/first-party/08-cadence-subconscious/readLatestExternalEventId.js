// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: readLatestExternalEventId  (minified: $bt, daemon.pretty.js:86154)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 2 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readLatestExternalEventId(paths) {
    let source;
    try {
        let eventFiles = (await yk.readdir(paths.eventsDir)).filter(fileName => fileName.endsWith(".jsonl")).sort();
        if (eventFiles.length === 0) return "";
        source = await yk.readFile(Sy.join(paths.eventsDir, eventFiles[eventFiles.length - 1]), "utf8")
    } catch {
        return ""
    }
    let parts = source.split(`
`);
    for (let i2 = parts.length - 1; i2 >= 0; i2 -= 1)
        if (parts[i2]) try {
            let parsed = JSON.parse(parts[i2]),
                sourceKind = parsed.source?.kind;
            if (sourceKind && !qg.has(sourceKind) && typeof parsed.id == "string") return parsed.id
        } catch {}
    return ""
}
