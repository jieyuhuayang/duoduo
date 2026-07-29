// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: lde, daemon.pretty.js:58708)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
    let t = ade(e.name),
        n = ade(e.description),
        r = e.developerInstructions.replaceAll("'''", '"""');
    return `${h5e}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
