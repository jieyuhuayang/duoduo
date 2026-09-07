// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: primeCodexAvailability  (minified: BXe, daemon.pretty.js:56069)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeCodexAvailability(e = "codex") {
    let t = await checkCodexAvailability(e);
    y2 = t.ok, _2 = t.ok ? void 0 : t.reason
}
