// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createOutboxDeliveryManager  (minified: Lot, daemon.pretty.js:78373)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createOutboxDeliveryManager(e) {
    let {
        paths: t,
        bus: n,
        subscriptions: r,
        maxAttempts: i = 5
    } = e, o = !1, s = new Set, a = new Map;

    function l(f) {
        let m = f.session_key,
            y = (a.get(m) ?? Promise.resolve(!1)).then(() => d(f)).catch(_ => (Z("[outbox-delivery] live delivery failed", {
                outboxId: f.id,
                sessionKey: f.session_key,
                error: _ instanceof Error ? _.message : String(_)
            }), !1));
        return a.set(m, y), y.then(() => {
            a.get(m) === y && a.delete(m)
        }), y
    }
    let u = ({
            record: f
        }) => {
            l(f)
        },
        c = () => {
            p().catch(f => {
                Z("[outbox-delivery] pending flush failed", {
                    error: f instanceof Error ? f.message : String(f)
                })
            })
        };
    async function d(f) {
        if (s.has(f.id)) return !1;
        s.add(f.id);
        try {
            if (f = await pa(t, f.channel_kind, f.id) ?? f, f.status === "sent") return await Fp(t, f.id), !0;
            if (await Aie(t, f.id)) return await nd(t, f, {
                status: "sent"
            }), !0;
            if (jot(f)) {
                let k = await nd(t, f, {
                    status: "sent"
                });
                return await Fp(t, k.id), !0
            }
            if (r.getSubscribers(f.session_key).length === 0) return !1;
            if (r.publishOutput(f.session_key, f) === 0) return f.attempts >= i || await nd(t, f, {
                status: "failed",
                error: "delivery failed"
            }), !1;
            let _ = await nd(t, f, {
                status: "sent"
            });
            return await Fp(t, _.id), Yi("delivered", _.id, {
                outboxId: _.id,
                sessionKey: _.session_key
            }), !0
        } finally {
            s.delete(f.id)
        }
    }
    async function p() {
        let f = await Bie(t, i),
            m = 0;
        for (let h of f) await l(h) && (m += 1);
        return m
    }
    return {
        start() {
            o || (o = !0, n.on("session.output", u), n.on("cadence.tick", c))
        },
        stop() {
            o && (o = !1, n.off("session.output", u), n.off("cadence.tick", c))
        },
        flushPending: p
    }
}
