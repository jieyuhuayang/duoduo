// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: primeGrokAvailability  (minified: XXe, daemon.pretty.js:57162)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeGrokAvailability(e = "grok") {
    let t = await checkGrokAvailability(e);
    S2 = t.ok, k2 = t.ok ? void 0 : t.reason
}
