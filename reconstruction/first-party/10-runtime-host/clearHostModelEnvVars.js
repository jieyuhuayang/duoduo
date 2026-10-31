// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvVars  (minified: RW, daemon.pretty.js:70322)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.3 (medium): fix(daemon): forward ANTHROPIC_* env and apply onboard state on upgrade
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function clearHostModelEnvVars(env = process.env) {
    for (let key of HOST_MODEL_ENV_KEYS) delete env[key]
}
