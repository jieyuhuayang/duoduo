// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolvePiWorkerCommand  (minified: qS, daemon.pretty.js:75116)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (high): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePiWorkerCommand() {
    let moduleDir = wbt(Sbt(import.meta.url)),
        workerPath = wJ(moduleDir, "pi-worker.js");
    return bbt(workerPath) ? {
        command: process.execPath,
        args: [workerPath]
    } : {
        command: wJ(moduleDir, "..", "..", "node_modules", ".bin", "tsx"),
        args: [wJ(moduleDir, "pi", "worker.ts")]
    }
}
