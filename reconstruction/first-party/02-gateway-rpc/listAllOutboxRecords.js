// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: listAllOutboxRecords  (minified: dv, daemon.pretty.js:38197)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function listAllOutboxRecords(paths) {
    let entries = [];
    try {
        entries = await In.readdir(paths.outboxDir)
    } catch {
        return []
    }
    let records = [];
    for (let channelKind of entries) {
        let channelDir = Fr.join(paths.outboxDir, channelKind);
        try {
            if (!(await In.stat(channelDir)).isDirectory()) continue
        } catch {
            continue
        }
        let channelRecords = await Sfe(paths, channelKind);
        records.push(...channelRecords)
    }
    return records
}
