// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: stringToMessageGenerator  (minified: _C, daemon.pretty.js:56772)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 1 renamed — 0 from the code at the binding (rule), 1 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* stringToMessageGenerator(prompt) {
    yield {
        type: "user",
        message: {
            role: "user",
            content: prompt
        }
    }
}
