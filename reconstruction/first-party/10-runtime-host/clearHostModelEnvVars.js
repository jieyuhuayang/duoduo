// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: clearHostModelEnvVars  (minified: kL, daemon.pretty.js:43875)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function clearHostModelEnvVars(e = process.env) {
 for (let t of HOST_MODEL_ENV_KEYS) delete e[t]
}
