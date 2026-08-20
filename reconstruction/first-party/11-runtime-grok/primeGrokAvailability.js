// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: primeGrokAvailability  (minified: VXe, daemon.pretty.js:59905)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeGrokAvailability(e = "grok") {
    let t = await checkGrokAvailability(e);
    O2 = t.ok, $2 = t.ok ? void 0 : t.reason
}
