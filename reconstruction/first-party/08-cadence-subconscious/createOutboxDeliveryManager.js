// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createOutboxDeliveryManager  (minified: Zgt, daemon.pretty.js:86706)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createOutboxDeliveryManager(e) {
    let {
        paths: t,
        bus: n,
        subscriptions: r,
        maxAttempts: i = 5
    } = e, o = !1, s = new Set, a = new Map;

    function u(h) {
        let g = h.session_key,
            v = (a.get(g) ?? Promise.resolve(!1)).then(() => d(h)).catch(b => (Z("[outbox-delivery] live delivery failed", {
                outboxId: h.id,
                sessionKey: h.session_key,
                error: b instanceof Error ? b.message : String(b)
            }), !1));
        return a.set(g, v), v.then(() => {
            a.get(g) === v && a.delete(g)
        }), v
    }
    let l = ({
            record: h
        }) => {
            u(h)
        },
        c = () => {
            p().catch(h => {
                Z("[outbox-delivery] pending flush failed", {
                    error: h instanceof Error ? h.message : String(h)
                })
            })
        };
    async function d(h) {
        if (s.has(h.id)) return !1;
        s.add(h.id);
        try {
            if (h = await La(t, h.channel_kind, h.id) ?? h, h.status === "sent") return await qm(t, h.id), !0;
            if (await gle(t, h.id)) return await Xd(t, h, {
                status: "sent"
            }), !0;
            if (Jgt(h)) {
                let _ = await Xd(t, h, {
                    status: "sent"
                });
                return await qm(t, _.id), !0
            }
            if (r.getSubscribers(h.session_key).length === 0) return !1;
            if (r.publishOutput(h.session_key, h) === 0) return h.attempts >= i || await Xd(t, h, {
                status: "failed",
                error: "delivery failed"
            }), !1;
            let b = await Xd(t, h, {
                status: "sent"
            });
            return await qm(t, b.id), fo("delivered", b.id, {
                outboxId: b.id,
                sessionKey: b.session_key
            }), !0
        } finally {
            s.delete(h.id)
        }
    }
    let f = new Set;

    function p() {
        let h = m();
        return f.add(h), h.then(() => f.delete(h), () => f.delete(h)), h
    }
    async function m() {
        let h = await Rle(t, i),
            g = 0;
        for (let y of h) await u(y) && (g += 1);
        return g
    }
    return {
        start() {
            o || (o = !0, n.on("session.output", l), n.on("cadence.tick", c))
        },
        async stop() {
            o && (o = !1, n.off("session.output", l), n.off("cadence.tick", c), await Promise.allSettled([...f, ...a.values()]))
        },
        flushPending: p
    }
}
