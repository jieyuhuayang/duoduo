// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: Gke, daemon.pretty.js:69626)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(agent) {
    let escapedName = Hke(agent.name),
        escapedDescription = Hke(agent.description),
        instructions = agent.developerInstructions.replaceAll("'''", '"""');
    return `${emt}

name = "${escapedName}"
description = "${escapedDescription}"
developer_instructions = '''
${instructions}
'''
`
}
