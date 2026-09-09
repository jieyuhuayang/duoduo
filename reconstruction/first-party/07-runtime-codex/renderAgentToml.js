// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: Yye, daemon.pretty.js:63479)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
    let t = Gye(e.name),
        n = Gye(e.description),
        r = e.developerInstructions.replaceAll("'''", '"""');
    return `${Vit}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
