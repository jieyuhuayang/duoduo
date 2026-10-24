// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: drainRecordPath  (minified: Ya, daemon.pretty.js:39122)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function drainRecordPath(paths, sessionKey) {
    return Rit.join(paths.usageDir, `${Tit(sessionKey)}.jsonl`)
}
