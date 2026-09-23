// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: tSe, daemon.pretty.js:69334)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
    let t = Xwe(e.name),
        n = Xwe(e.description),
        r = e.developerInstructions.replaceAll("'''", '"""');
    return `${hdt}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
