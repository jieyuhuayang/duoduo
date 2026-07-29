// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createOutboxDeliveryManager  (minified: Net, daemon.pretty.js:75190)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createOutboxDeliveryManager(e) {
    let {
        paths: t,
        bus: n,
        subscriptions: r,
        maxAttempts: i = 5
    } = e, s = !1, o = new Set, a = new Map;

    function c(f) {
        let m = f.session_key,
            _ = (a.get(m) ?? Promise.resolve(!1)).then(() => d(f)).catch(b => (se("[outbox-delivery] live delivery failed", {
                outboxId: f.id,
                sessionKey: f.session_key,
                error: b instanceof Error ? b.message : String(b)
            }), !1));
        return a.set(m, _), _.then(() => {
            a.get(m) === _ && a.delete(m)
        }), _
    }
    let u = ({
            record: f
        }) => {
            c(f)
        },
        l = () => {
            p().catch(f => {
                se("[outbox-delivery] pending flush failed", {
                    error: f instanceof Error ? f.message : String(f)
                })
            })
        };
    async function d(f) {
        if (o.has(f.id)) return !1;
        o.add(f.id);
        try {
            if (f = await Go(t, f.channel_kind, f.id) ?? f, f.status === "sent") return await Xf(t, f.id), !0;
            if (await ane(t, f.id)) return await Rl(t, f, {
                status: "sent"
            }), !0;
            if (Aet(f)) {
                let w = await Rl(t, f, {
                    status: "sent"
                });
                return await Xf(t, w.id), !0
            }
            if (r.getSubscribers(f.session_key).length === 0) return !1;
            if (r.publishOutput(f.session_key, f) === 0) return f.attempts >= i || await Rl(t, f, {
                status: "failed",
                error: "delivery failed"
            }), !1;
            let b = await Rl(t, f, {
                status: "sent"
            });
            return await Xf(t, b.id), Ci("delivered", b.id, {
                outboxId: b.id,
                sessionKey: b.session_key
            }), !0
        } finally {
            o.delete(f.id)
        }
    }
    async function p() {
        let f = await yne(t, i),
            m = 0;
        for (let h of f) await c(h) && (m += 1);
        return m
    }
    return {
        start() {
            s || (s = !0, n.on("session.output", u), n.on("cadence.tick", l))
        },
        stop() {
            s && (s = !1, n.off("session.output", u), n.off("cadence.tick", l))
        },
        flushPending: p
    }
}
