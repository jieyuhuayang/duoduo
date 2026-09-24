// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: recordOutboxDeliveryAttempt  (minified: Xd, daemon.pretty.js:36029)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function recordOutboxDeliveryAttempt(e, t, n) {
    let r = new Date().toISOString(),
        i = {
            ...t,
            status: n.status,
            attempts: t.attempts + 1,
            last_attempt_at: r,
            last_error: n.error ?? null
        },
        o = resolveOutboxRecordPath(e, t.channel_kind, t.id);
    await $e(Mr.dirname(o)), await Bt(o, i);
    try {
        n.status === "sent" ? await SXe(e, t.id) : n.status === "failed" && await kXe(e, {
            record_id: t.id,
            channel_kind: t.channel_kind,
            session_key: t.session_key,
            status: "failed",
            attempts: i.attempts,
            created_at: t.created_at
        })
    } catch {}
    return i
}
