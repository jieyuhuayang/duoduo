// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: initRemindDuoduoToolModule  (minified: Rw, daemon.pretty.js:64327)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var Ew, __e, _$, Oat, b$, v$, w$, initRemindDuoduoToolModule = O(() => {
    "use strict";
    lc();
    dt();
    initJobManagerModule();
    Ew = "RemindDuoduo", __e = "mcp__aladuo__RemindDuoduo", _$ = "Schedule one future turn of this session when your current work needs a later check\nor action and no existing job or callback will bring you back in time. Provide `when`\n(`@in 30m`, or an ISO timestamp with an explicit zone; for a fixed event, confirm its\nactual date and zone first) and a `context` written for a turn that remembers nothing:\nwhy you must return, the first action, where the current evidence lives, who is waiting,\nand what to do if this turn arrives late. This does not delegate work, start another\nsession, or remind the user: at or after the requested time your context is delivered to\nthis session without interrupting a turn already in progress. It fires once; call\nRemindDuoduo again from the woken turn if you still need to check later. The daemon\nreturns an id; `ManageJob(list)` shows it and `duoduo job archive <id>` cancels it before\nit fires. Use `ManageJob(create)` for separate work and `Notify` to reach another session\nnow.", Oat = 'When to come back: "@in <duration>" (e.g. "@in 30m", "@in 1d6h") or an ISO 8601 timestamp with an explicit timezone (e.g. "2026-09-11T02:00:00Z"). "@in 0s" means the next scan, i.e. right after this turn.', b$ = {
        when: ft.string().describe(Oat),
        context: ft.string().describe("What the woken turn should inspect and where the current evidence lives. It is the only input that turn has — write it for a version of you that remembers nothing about this moment.")
    }, v$ = "Give this job one more run at `when` (`@in 30m`, or a future ISO timestamp with an explicit\nzone). Your schedule class does not change: a recurring job keeps its cadence alongside\nthis extra run, a one-shot job stays alive for it. Call it before this run ends. A second\ncall replaces the pending time. Write anything you want the next run to look at into your\nworking directory, or rely on your thread; nothing else is carried.", w$ = {
        when: ft.string().describe('When to run once more: "@in <duration>" (e.g. "@in 30m") or a FUTURE ISO 8601 timestamp with an explicit timezone (e.g. "2026-09-11T02:00:00Z"). A time at or before now is rejected — it would be consumed as already spent when this run finalizes, silently ending the loop.')
    }
});
