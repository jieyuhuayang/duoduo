// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: removeHostModelEnvLines  (minified: uxe, daemon.pretty.js:70279)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): refactor: simplify host onboarding auth flow
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function removeHostModelEnvLines(content) {
    return sxe(content).filter(line => {
        let key = axe(line);
        return !key || !uht(key)
    })
}
