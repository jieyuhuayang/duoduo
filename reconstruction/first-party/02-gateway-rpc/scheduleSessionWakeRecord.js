// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: scheduleSessionWakeRecord  (minified: Syt, daemon.pretty.js:89541)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function scheduleSessionWakeRecord(e, t, n) {
    let r = n.session_key.trim(),
        i = resolveSessionByKeyOrAlias(t, r);
    if (!i.ok) return {
        ok: !1,
        reason: "not_found",
        session_key: r,
        error: i.reason === "ambiguous" ? `'${r}' matches more than one session — pass a full session_key.` : `No such session: ${r}`
    };
    let o = resolveIsolatedPlaneKind(i.session_key);
    if (o) return {
        ok: !1,
        reason: "forbidden_kind",
        session_key: i.session_key,
        kind: o,
        error: `Only channel and job sessions can be woken — ${i.session_key} is a ${o} session, and the ${o} plane is isolated.`
    };
    let s = new Date;
    try {
        parseJobRearmTime(n.when, s)
    } catch (a) {
        return {
            ok: !1,
            reason: "invalid_when",
            session_key: i.session_key,
            error: a instanceof Error ? a.message : String(a)
        }
    }
    try {
        let a = new Ur(e),
            {
                id: u,
                runAt: l
            } = await a.createWakeRecord({
                ownerSession: i.session_key,
                when: n.when,
                context: n.context,
                now: s
            });
        return {
            ok: !0,
            session_key: i.session_key,
            wake_id: u,
            run_at: l
        }
    } catch (a) {
        return {
            ok: !1,
            reason: "failed",
            session_key: i.session_key,
            error: a instanceof Error ? a.message : String(a)
        }
    }
}
