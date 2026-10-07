// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: attachStreamLineReader  (minified: Xl, daemon.pretty.js:31880)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): pi joins Claude, Codex and Grok as a fourth agent runtime.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function attachStreamLineReader(e, t, n) {
    let r = gae(t),
        i = !1,
        o = u => {
            r.write(u)
        },
        s = () => {
            i || (i = !0, r.flush(), a(), n?.onEof?.())
        },
        a = () => {
            e.off("data", o), e.off("end", s), e.off("close", s)
        };
    return e.on("data", o), e.on("end", s), e.on("close", s), {
        close() {
            i || (i = !0, a())
        }
    }
}
