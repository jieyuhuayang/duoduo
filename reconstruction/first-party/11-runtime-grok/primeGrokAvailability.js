// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: primeGrokAvailability  (minified: Oft, daemon.pretty.js:65367)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (medium): Availability is checked against the Grok CLI you already have installed
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function primeGrokAvailability(grokBinary = "grok") {
    let availability = await checkGrokAvailability(grokBinary);
    p6 = availability.ok, m6 = availability.ok ? void 0 : availability.reason
}
