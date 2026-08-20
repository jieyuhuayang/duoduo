// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: primeCodexAvailability  (minified: DXe, daemon.pretty.js:58740)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeCodexAvailability(e = "codex") {
    let t = await checkCodexAvailability(e);
    R2 = t.ok, T2 = t.ok ? void 0 : t.reason
}
