// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: fireDueWakeRecords  (minified: Obt, daemon.pretty.js:86938)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 13 renamed — 4 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.2 (medium): A session can schedule its own next turn.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function fireDueWakeRecords(paths, jobManager, now, bus) {
    let delivered = [],
        wakeRecords;
    try {
        wakeRecords = await jobManager.listWakeRecords()
    } catch (err) {
        return logWarnMessage("[cadence] wake scan failed to list records", {
            error: err instanceof Error ? err.message : String(err)
        }), delivered
    }
    for (let wakeRecord of wakeRecords) try {
        let runAt = wakeRecord.state.run_at;
        if (typeof runAt != "string" || runAt.length === 0) continue;
        let runAtMs = Date.parse(runAt);
        if (!Number.isFinite(runAtMs) || now.getTime() < runAtMs) continue;
        if (!bus) {
            logWarnMessage("[cadence] wake due but no bus available to deliver it", {
                wakeId: wakeRecord.id,
                owner: wakeRecord.frontmatter.owner_session
            });
            continue
        }
        let {
            outcome
        } = await jobManager.fireWakeRecord(wakeRecord.id, now, record => deliverRouteEventToSession(paths, bus, {
            traceId: `wake-${record.id}`,
            routeId: `wake:${record.id}`,
            sourceName: "wake",
            targetSessionKey: record.frontmatter.owner_session,
            sourceSessionKey: record.frontmatter.owner_session,
            eventType: "self-wake",
            preempt: "never",
            payload: {
                wake_id: record.id,
                context: record.context,
                set_at: record.frontmatter.created_at,
                due_at: record.state.run_at
            }
        }));
        outcome === "delivered" && (delivered.push(wakeRecord.id), logInfoMessage("[cadence] wake delivered", {
            wakeId: wakeRecord.id,
            target: wakeRecord.frontmatter.owner_session,
            dueAt: runAt
        }))
    } catch (err) {
        logWarnMessage("[cadence] wake fire failed; record left for the next scan", {
            wakeId: wakeRecord.id,
            error: err instanceof Error ? err.message : String(err)
        })
    }
    return delivered
}
