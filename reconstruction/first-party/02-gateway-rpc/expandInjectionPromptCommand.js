// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: expandInjectionPromptCommand  (minified: hde, daemon.pretty.js:87471)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.7 (medium): The recurring `/loop` capability is now one entry in a general mechanism for named prompt injections, with a self-describing `duoduo prompts` CLI to list what's available.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function expandInjectionPromptCommand(e, t) {
    if (!(!e || !e.args)) return {
        text: `${e.prompt}

${e.args}`,
        rawCommand: t.trim()
    }
}
