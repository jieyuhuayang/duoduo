// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: collectGrokToolCallNames  (minified: s_e, daemon.pretty.js:63046)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectGrokToolCallNames(e) {
    let t = $i(e._meta);
    return [$i(t["x.ai/tool"]).name, e.name, e.toolName, e.title, e.kind].filter(i => typeof i == "string" && i.length > 0)
}
