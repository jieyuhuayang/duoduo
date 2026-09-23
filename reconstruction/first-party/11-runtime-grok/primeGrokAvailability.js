// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: primeGrokAvailability  (minified: Mst, daemon.pretty.js:62965)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeGrokAvailability(e = "grok") {
    let t = await checkGrokAvailability(e);
    PV = t.ok, CV = t.ok ? void 0 : t.reason
}
