// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: createOutboxDeliveryManager  (minified: IQe, daemon.pretty.js:75485)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function createOutboxDeliveryManager(e) {
 let {
  paths: t,
  bus: n,
  subscriptions: r,
  maxAttempts: i = 5
 } = e, o = !1, s = new Set, a = ({
  record: d
 }) => {
  u(d)
   .catch(p => {
    fe("[outbox-delivery] live delivery failed", {
     outboxId: d.id,
     sessionKey: d.session_key,
     error: p instanceof Error ? p.message : String(p)
    })
   })
 }, c = () => {
  l()
   .catch(d => {
    fe("[outbox-delivery] pending flush failed", {
     error: d instanceof Error ? d.message : String(d)
    })
   })
 };
 async function u(d) {
  if (s.has(d.id)) return !1;
  s.add(d.id);
  try {
   if (d = await $s(t, d.channel_kind, d.id) ?? d, d.status === "sent") return await Lf(t, d.id), !0;
   if (await Gte(t, d.id)) return await gl(t, d, {
    status: "sent"
   }), !0;
   if (RQe(d)) {
    let g = await gl(t, d, {
     status: "sent"
    });
    return await Lf(t, g.id), !0
   }
   if (r.getSubscribers(d.session_key)
    .length === 0) return !1;
   if (r.publishOutput(d.session_key, d) === 0) return d.attempts >= i || await gl(t, d, {
    status: "failed",
    error: "delivery failed"
   }), !1;
   let h = await gl(t, d, {
    status: "sent"
   });
   return await Lf(t, h.id), Si("delivered", h.id, {
    outboxId: h.id,
    sessionKey: h.session_key
   }), !0
  } finally {
   s.delete(d.id)
  }
 }
 async function l() {
  let d = await one(t, i),
   p = 0;
  for (let f of d) try {
   await u(f) && (p += 1)
  } catch (m) {
   fe("[outbox-delivery] pending record delivery failed", {
    outboxId: f.id,
    sessionKey: f.session_key,
    error: m instanceof Error ? m.message : String(m)
   })
  }
  return p
 }
 return {
  start() {
   o || (o = !0, n.on("session.output", a), n.on("cadence.tick", c))
  },
  stop() {
   o && (o = !1, n.off("session.output", a), n.off("cadence.tick", c))
  },
  flushPending: l
 }
}
