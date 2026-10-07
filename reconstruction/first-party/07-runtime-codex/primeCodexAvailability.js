// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: primeCodexAvailability  (minified: Eut, daemon.pretty.js:62156)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.0 (medium): The daemon now probes `codex --version` and `codex login status` at boot: if the CLI is installed and the user is logged in, codex is advertised
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeCodexAvailability(e = "codex") {
    let t = await checkCodexAvailability(e);
    I6 = t.ok, T6 = t.ok ? void 0 : t.reason
}
