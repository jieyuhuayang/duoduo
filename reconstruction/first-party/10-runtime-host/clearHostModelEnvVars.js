// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvVars  (minified: Y6, daemon.pretty.js:68832)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function clearHostModelEnvVars(e = process.env) {
    for (let t of HOST_MODEL_ENV_KEYS) delete e[t]
}
