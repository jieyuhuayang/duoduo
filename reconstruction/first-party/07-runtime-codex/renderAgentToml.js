// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: renderAgentToml  (minified: kle, daemon.pretty.js:58933)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderAgentToml(e) {
 let t = ble(e.name),
  n = ble(e.description),
  r = e.developerInstructions.replaceAll("'''", '"""');
 return `${gKe}

name = "${t}"
description = "${n}"
developer_instructions = '''
${r}
'''
`
}
