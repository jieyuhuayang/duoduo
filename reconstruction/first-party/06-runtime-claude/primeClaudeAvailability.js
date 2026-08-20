// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: primeClaudeAvailability  (minified: E9e, daemon.pretty.js:49155)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeClaudeAvailability() {
    await probeClaudeAvailability().catch(() => {})
}
