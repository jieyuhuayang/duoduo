// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: Dme, daemon.pretty.js:60966)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
    let t = $me(e.name),
        n = $me(e.description),
        r = e.developerInstructions.replaceAll("'''", '"""');
    return `${uQe}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
