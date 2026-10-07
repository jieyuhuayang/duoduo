// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: Hke, daemon.pretty.js:69625)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
    let t = qke(e.name),
        n = qke(e.description),
        r = e.developerInstructions.replaceAll("'''", '"""');
    return `${Xpt}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
