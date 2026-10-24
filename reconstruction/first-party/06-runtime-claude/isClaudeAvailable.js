// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: isClaudeAvailable  (minified: XH, daemon.pretty.js:57418)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// changelog v0.5.3 (medium): Hosts can expose whichever runtimes are actually installed and authenticated.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isClaudeAvailable() {
    return Ec?.ok === !0
}
