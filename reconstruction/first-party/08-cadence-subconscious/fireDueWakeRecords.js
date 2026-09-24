// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: fireDueWakeRecords  (minified: Ggt, daemon.pretty.js:86585)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function fireDueWakeRecords(e, t, n, r) {
    let i = [],
        o;
    try {
        o = await t.listWakeRecords()
    } catch (s) {
        return Z("[cadence] wake scan failed to list records", {
            error: s instanceof Error ? s.message : String(s)
        }), i
    }
    for (let s of o) try {
        let a = s.state.run_at;
        if (typeof a != "string" || a.length === 0) continue;
        let u = Date.parse(a);
        if (!Number.isFinite(u) || n.getTime() < u) continue;
        if (!r) {
            Z("[cadence] wake due but no bus available to deliver it", {
                wakeId: s.id,
                owner: s.frontmatter.owner_session
            });
            continue
        }
        let {
            outcome: l
        } = await t.fireWakeRecord(s.id, n, c => deliverRouteEventToSession(e, r, {
            traceId: `wake-${c.id}`,
            routeId: `wake:${c.id}`,
            sourceName: "wake",
            targetSessionKey: c.frontmatter.owner_session,
            sourceSessionKey: c.frontmatter.owner_session,
            eventType: "self-wake",
            preempt: "never",
            payload: {
                wake_id: c.id,
                context: c.context,
                set_at: c.frontmatter.created_at,
                due_at: c.state.run_at
            }
        }));
        l === "delivered" && (i.push(s.id), te("[cadence] wake delivered", {
            wakeId: s.id,
            target: s.frontmatter.owner_session,
            dueAt: a
        }))
    } catch (a) {
        Z("[cadence] wake fire failed; record left for the next scan", {
            wakeId: s.id,
            error: a instanceof Error ? a.message : String(a)
        })
    }
    return i
}
