// duoduo reconstruction — subsystem: 09-memory
// symbol: computeBoardLayerHash  (minified: SG, daemon.pretty.js:82701)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoardLayerHash(boardText) {
    return qRe("sha256").update(JSON.stringify([boardText ?? ""])).digest("hex")
}
