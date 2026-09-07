// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: rye, daemon.pretty.js:62892)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
    let t = eye(e.name),
        n = eye(e.description),
        r = e.developerInstructions.replaceAll("'''", '"""');
    return `${frt}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
