// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: expandInjectionPromptCommand  (minified: hde, daemon.pretty.js:87471)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function expandInjectionPromptCommand(e, t) {
    if (!(!e || !e.args)) return {
        text: `${e.prompt}

${e.args}`,
        rawCommand: t.trim()
    }
}
