// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createOutboxDeliveryManager  (minified: Jlt, daemon.pretty.js:79821)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createOutboxDeliveryManager(e) {
    let {
        paths: t,
        bus: n,
        subscriptions: r,
        maxAttempts: i = 5
    } = e, o = !1, s = new Set, a = new Map;

    function l(h) {
        let g = h.session_key,
            w = (a.get(g) ?? Promise.resolve(!1)).then(() => d(h)).catch(v => (J("[outbox-delivery] live delivery failed", {
                outboxId: h.id,
                sessionKey: h.session_key,
                error: v instanceof Error ? v.message : String(v)
            }), !1));
        return a.set(g, w), w.then(() => {
            a.get(g) === w && a.delete(g)
        }), w
    }
    let u = ({
            record: h
        }) => {
            l(h)
        },
        c = () => {
            f().catch(h => {
                J("[outbox-delivery] pending flush failed", {
                    error: h instanceof Error ? h.message : String(h)
                })
            })
        };
    async function d(h) {
        if (s.has(h.id)) return !1;
        s.add(h.id);
        try {
            if (h = await ha(t, h.channel_kind, h.id) ?? h, h.status === "sent") return await Xp(t, h.id), !0;
            if (await Goe(t, h.id)) return await gd(t, h, {
                status: "sent"
            }), !0;
            if (Wlt(h)) {
                let b = await gd(t, h, {
                    status: "sent"
                });
                return await Xp(t, b.id), !0
            }
            if (r.getSubscribers(h.session_key).length === 0) return !1;
            if (r.publishOutput(h.session_key, h) === 0) return h.attempts >= i || await gd(t, h, {
                status: "failed",
                error: "delivery failed"
            }), !1;
            let v = await gd(t, h, {
                status: "sent"
            });
            return await Xp(t, v.id), Bi("delivered", v.id, {
                outboxId: v.id,
                sessionKey: v.session_key
            }), !0
        } finally {
            s.delete(h.id)
        }
    }
    let p = new Set;

    function f() {
        let h = m();
        return p.add(h), h.then(() => p.delete(h), () => p.delete(h)), h
    }
    async function m() {
        let h = await ise(t, i),
            g = 0;
        for (let y of h) await l(y) && (g += 1);
        return g
    }
    return {
        start() {
            o || (o = !0, n.on("session.output", u), n.on("cadence.tick", c))
        },
        async stop() {
            o && (o = !1, n.off("session.output", u), n.off("cadence.tick", c), await Promise.allSettled([...p, ...a.values()]))
        },
        flushPending: f
    }
}
