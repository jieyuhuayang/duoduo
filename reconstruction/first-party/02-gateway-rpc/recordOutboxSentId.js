// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: recordOutboxSentId  (minified: ch, daemon.pretty.js:36243)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordOutboxSentId(paths, recordId) {
    let sentIds = await Oce(paths);
    sentIds.has(recordId) || (await ensureDirectoryExists(paths.outboxDir), await Rn.appendFile(resolveOutboxSentIdsPath(paths), `${recordId}
`), sentIds.add(recordId))
}
