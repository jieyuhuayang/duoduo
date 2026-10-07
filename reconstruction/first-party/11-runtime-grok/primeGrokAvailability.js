// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: primeGrokAvailability  (minified: Nut, daemon.pretty.js:63284)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.7.1 (medium): Availability is checked against the Grok CLI you already have installed
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeGrokAvailability(e = "grok") {
    let t = await checkGrokAvailability(e);
    O6 = t.ok, A6 = t.ok ? void 0 : t.reason
}
