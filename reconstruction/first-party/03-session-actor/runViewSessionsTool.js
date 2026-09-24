// duoduo reconstruction — subsystem: 03-session-actor
// symbol: runViewSessionsTool  (minified: pg, daemon.pretty.js:64262)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function runViewSessionsTool(e, t) {
    let {
        paths: n,
        sessionKey: r
    } = t;
    try {
        let i = e && typeof e.session_key == "string" ? e.session_key.trim() : "";
        return i.length === 0 ? await Cat(n, r) : await $at(n, i, t.getSessionStatus)
    } catch (i) {
        return Le("[ViewSessions] Tool execution failed", i), `Error: ${i instanceof Error?i.message:String(i)}`
    }
}
