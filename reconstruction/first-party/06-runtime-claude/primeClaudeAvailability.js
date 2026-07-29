// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: primeClaudeAvailability  (minified: KJe, daemon.pretty.js:48194)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeClaudeAvailability() {
    await probeClaudeAvailability().catch(() => {})
}
