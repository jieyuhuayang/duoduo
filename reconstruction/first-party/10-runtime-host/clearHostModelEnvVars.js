// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvVars  (minified: YH, daemon.pretty.js:69123)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// changelog v0.4.3 (medium): fix(daemon): forward ANTHROPIC_* env and apply onboard state on upgrade
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function clearHostModelEnvVars(e = process.env) {
    for (let t of HOST_MODEL_ENV_KEYS) delete e[t]
}
