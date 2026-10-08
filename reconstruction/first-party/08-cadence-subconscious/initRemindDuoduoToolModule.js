// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initRemindDuoduoToolModule  (minified: nS, daemon.pretty.js:65006)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (high): `Wake` is now `RemindDuoduo`
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var tS, Xbe, uO, jlt, lO, cO, dO, initRemindDuoduoToolModule = O(() => {
    "use strict";
    vc();
    initLogLevelModule();
    initJobManagerModule();
    tS = "RemindDuoduo", Xbe = "mcp__aladuo__RemindDuoduo", uO = "Schedule one future turn of this session when your current work needs a later check\nor action and no existing job or callback will bring you back in time. Provide `when`\n(`@in 30m`, or an ISO timestamp with an explicit zone; for a fixed event, confirm its\nactual date and zone first) and a `context` written for a turn that remembers nothing:\nwhy you must return, the first action, where the current evidence lives, who is waiting,\nand what to do if this turn arrives late. This does not delegate work, start another\nsession, or remind the user: at or after the requested time your context is delivered to\nthis session without interrupting a turn already in progress. It fires once; call\nRemindDuoduo again from the woken turn if you still need to check later. The daemon\nreturns an id; `ManageJob(list)` shows it and `duoduo job archive <id>` cancels it before\nit fires. Use `ManageJob(create)` for separate work and `Notify` to reach another session\nnow.", jlt = 'When to come back: "@in <duration>" (e.g. "@in 30m", "@in 1d6h") or an ISO 8601 timestamp with an explicit timezone (e.g. "2026-09-11T02:00:00Z"). "@in 0s" means the next scan, i.e. right after this turn.', lO = {
        when: mt.string().describe(jlt),
        context: mt.string().describe("What the woken turn should inspect and where the current evidence lives. It is the only input that turn has — write it for a version of you that remembers nothing about this moment.")
    }, cO = "Give this job one more run at `when` (`@in 30m`, or a future ISO timestamp with an explicit\nzone). Your schedule class does not change: a recurring job keeps its cadence alongside\nthis extra run, a one-shot job stays alive for it. Call it before this run ends. A second\ncall replaces the pending time. Write anything you want the next run to look at into your\nworking directory, or rely on your thread; nothing else is carried.", dO = {
        when: mt.string().describe('When to run once more: "@in <duration>" (e.g. "@in 30m") or a FUTURE ISO 8601 timestamp with an explicit timezone (e.g. "2026-09-11T02:00:00Z"). A time at or before now is rejected — it would be consumed as already spent when this run finalizes, silently ending the loop.')
    }
});
