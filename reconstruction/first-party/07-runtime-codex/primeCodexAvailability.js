// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: primeCodexAvailability  (minified: qct, daemon.pretty.js:63427)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): The daemon now probes `codex --version` and `codex login status` at boot: if the CLI is installed and the user is logged in, codex is advertised
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeCodexAvailability(codexBinary = "codex") {
    let availability = await checkCodexAvailability(codexBinary);
    XH = availability.ok, QH = availability.ok ? void 0 : availability.reason
}
