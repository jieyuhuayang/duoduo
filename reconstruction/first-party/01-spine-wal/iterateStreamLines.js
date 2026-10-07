// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: iterateStreamLines  (minified: gs, daemon.pretty.js:31898)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): Log lines containing U+2028 were shredded on read, because the line reader treated it as a line break and JSON does not.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* iterateStreamLines(e, t) {
    let n = t?.onEof !== void 0,
        r = [],
        i = !1,
        o, s = null,
        a = () => {
            let f = s;
            s = null, f?.()
        },
        u = gae(f => r.push(f)),
        l = f => {
            u.write(f), n || e.pause(), a()
        },
        c = () => {
            i || (u.flush(), i = !0, a(), t?.onEof?.())
        },
        d = f => {
            i || (o = f ?? new Error("stream error"), i = !0, a())
        };
    e.on("data", l), e.on("end", c), e.on("close", c), e.on("error", d);
    try {
        for (;;) {
            for (; r.length > 0;) yield r.shift();
            if (i) break;
            e.resume(), await new Promise(f => {
                s = f
            })
        }
        if (o !== void 0) throw o
    } finally {
        e.off("data", l), e.off("end", c), e.off("close", c), e.off("error", d), e.destroy()
    }
}
