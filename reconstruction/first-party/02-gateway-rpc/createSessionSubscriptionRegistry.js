// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: createSessionSubscriptionRegistry  (minified: l6, daemon.pretty.js:88639)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createSessionSubscriptionRegistry() {
    let e = new Map,
        t = new Map,
        n = null,
        r = {},
        i = ["final", "stream"],
        o = (f, p) => (f.returnMask ?? i).includes(p);

    function s(f, p) {
        let m = t.get(f);
        if (!m || m.size === 0) return 0;
        let h = {
                jsonrpc: "2.0",
                method: "session.output",
                params: {
                    session_key: f,
                    record: p
                }
            },
            g = 0;
        for (let y of m) {
            let v = e.get(y);
            if (v && o(v, "final")) try {
                v.send(h), g += 1
            } catch {
                d(y)
            }
        }
        return g
    }
    let a = f => {
            let {
                sessionKey: p,
                chunk: m,
                isSidechain: h,
                anchorEventId: g
            } = f, y = t.get(p);
            if (!y || y.size === 0) return;
            let v = {
                jsonrpc: "2.0",
                method: "session.stream",
                params: {
                    session_key: p,
                    chunk: m,
                    is_sidechain: h,
                    anchor_event_id: g
                }
            };
            for (let b of y) {
                let _ = e.get(b);
                if (_ && o(_, "stream")) try {
                    _.send(v)
                } catch {
                    d(b)
                }
            }
        },
        u = f => {
            let {
                sessionKey: p,
                event: m,
                anchorEventId: h,
                isSidechain: g
            } = f, y = t.get(p);
            if (!y || y.size === 0) return;
            let v = {
                jsonrpc: "2.0",
                method: "session.execution",
                params: {
                    session_key: p,
                    event: m,
                    is_sidechain: g,
                    anchor_event_id: h
                }
            };
            for (let b of y) {
                let _ = e.get(b);
                if (_ && o(_, "tool")) try {
                    _.send(v)
                } catch {
                    d(b)
                }
            }
        },
        l = f => {
            let {
                sessionKey: p,
                reason: m,
                anchorEventId: h
            } = f, g = t.get(p);
            if (!(!g || g.size === 0))
                for (let y of g) {
                    let v = e.get(y);
                    if (v && o(v, "stream_end")) {
                        let b = m === "interrupted" || v.acceptStreamEndReasons?.includes(m) ? m : "interrupted",
                            _ = {
                                jsonrpc: "2.0",
                                method: "session.stream_end",
                                params: {
                                    session_key: p,
                                    reason: b,
                                    anchor_event_id: h
                                }
                            };
                        try {
                            v.send(_)
                        } catch {
                            d(y)
                        }
                    }
                }
        };

    function c(f) {
        let {
            id: p,
            sessionKey: m
        } = f;
        e.has(p) && d(p), e.set(p, f);
        let h = t.get(m);
        h || (h = new Set, t.set(m, h)), h.add(p), r.onAttach && r.onAttach(m, p)
    }

    function d(f) {
        let p = e.get(f);
        if (!p) return;
        let {
            sessionKey: m
        } = p, h = t.get(m);
        h && (h.delete(f), h.size === 0 && t.delete(m)), e.delete(f), r.onDetach && r.onDetach(m, f)
    }
    return {
        subscribe: c,
        unsubscribe: d,
        getSubscribers(f) {
            let p = t.get(f);
            return p ? Array.from(p).map(m => e.get(m)).filter(m => m !== void 0) : []
        },
        publishOutput: s,
        finalSubscriberCount(f) {
            let p = t.get(f);
            if (!p) return 0;
            let m = 0;
            for (let h of p) {
                let g = e.get(h);
                g && o(g, "final") && (m += 1)
            }
            return m
        },
        subscriberCount() {
            return e.size
        },
        start(f) {
            n || (n = f, n.on("session.stream", a), n.on("session.stream_end", l), n.on("session.execution", u))
        },
        stop() {
            if (n) {
                if (n.off("session.stream", a), n.off("session.stream_end", l), n.off("session.execution", u), n = null, r.onDetach)
                    for (let f of e.values()) r.onDetach(f.sessionKey, f.id);
                for (let f of e.values()) try {
                    f.close()
                } catch {}
                e.clear(), t.clear()
            }
        },
        setAttachmentCallbacks(f) {
            r = f
        }
    }
}
