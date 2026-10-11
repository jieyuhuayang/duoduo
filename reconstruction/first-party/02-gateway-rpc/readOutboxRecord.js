// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: readOutboxRecord  (minified: Ha, daemon.pretty.js:36090)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readOutboxRecord(paths, channelKind, recordId) {
    let outboxRecordPath = resolveOutboxRecordPath(paths, channelKind, recordId);
    try {
        let content = await Rn.readFile(outboxRecordPath, "utf8");
        return JSON.parse(content)
    } catch {
        return null
    }
}
