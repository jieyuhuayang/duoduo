// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: primeCodexAvailability  (minified: r5e, daemon.pretty.js:57389)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeCodexAvailability(e = "codex") {
    let t = await checkCodexAvailability(e);
    AU = t.ok, NU = t.ok ? void 0 : t.reason
}
