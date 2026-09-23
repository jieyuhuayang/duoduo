// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: primeCodexAvailability  (minified: $st, daemon.pretty.js:61837)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeCodexAvailability(e = "codex") {
    let t = await checkCodexAvailability(e);
    EV = t.ok, RV = t.ok ? void 0 : t.reason
}
