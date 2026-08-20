// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: grokAcpExtMethod  (minified: Lu, daemon.pretty.js:59955)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function grokAcpExtMethod(e) {
    let t = e.replace(/^_?x\.ai\//, "");
    return `${GROK_ACP_EXT_PREFIX}/${t}`
}
