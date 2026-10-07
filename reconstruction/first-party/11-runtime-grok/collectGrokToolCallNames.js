// duoduo reconstruction — subsystem: 11-runtime-grok
// symbol: collectGrokToolCallNames  (minified: Ibe, daemon.pretty.js:63365)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectGrokToolCallNames(e) {
    let t = Oi(e._meta);
    return [Oi(t["x.ai/tool"]).name, e.name, e.toolName, e.title, e.kind].filter(i => typeof i == "string" && i.length > 0)
}
