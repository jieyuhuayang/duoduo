// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: ede, daemon.pretty.js:58586)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
    let t = Yle(e.name),
        n = Yle(e.description),
        r = e.developerInstructions.replaceAll("'''", '"""');
    return `${t5e}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
