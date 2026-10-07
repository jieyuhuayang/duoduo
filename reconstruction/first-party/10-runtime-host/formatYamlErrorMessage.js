// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: formatYamlErrorMessage  (minified: Wi, daemon.pretty.js:35089)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatYamlErrorMessage(e) {
    return e instanceof Error && e.name === "YAMLException" ? e.message.split(`
`)[0].trim() : e instanceof Error ? e.message : String(e)
}
