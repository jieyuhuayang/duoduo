// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: primeClaudeAvailability  (minified: yrt, daemon.pretty.js:55027)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeClaudeAvailability() {
    await probeClaudeAvailability().catch(() => {})
}
