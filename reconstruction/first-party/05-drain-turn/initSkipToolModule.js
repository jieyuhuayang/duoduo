// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: initSkipToolModule  (minified: tl, daemon.pretty.js:56256)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.6, v0.8.7 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var $s, Ic, MV, s_e, iC, initSkipToolModule = A(() => {
    "use strict";
    Rc();
    initLogLevelModule();
    Rr();
    $s = "Skip", Ic = "mcp__aladuo__Skip", MV = ["End this turn with no output to the user/channel.", "", "Calling Skip immediately ends this turn. Skip is the only way to produce", "silence — any text you emit is user-visible output, including", 'acknowledgements such as "received" or "no need to reply".', "", "In a turn you decide to skip, write no text before Skip — text streamed before Skip", "can still reach the user. Tool calls before Skip are fine: do the work, or send what", "belongs elsewhere, then call Skip.", "", "Give a specific reason. On your next turn, a <skip-rewind> block returns:", "- The reason you provided", "- The timestamp of the skip", "- How much time has elapsed since the skip", "", "Use Skip for:", "- Intermediate job progress that isn't actionable yet", "- Routine system notifications that need no user attention", "- Duplicate or redundant notifications you've already addressed", "", "Respond instead of skipping when:", "- The user sent a direct message", "- A job completed with results the user is waiting for", "- An error or anomaly requires user attention"].join(`
`), s_e = MV.replace("Calling Skip immediately ends this turn.", "After you call Skip, nothing further you produce this turn will be delivered."), iC = {
        reason: ht.string().describe("Why you are skipping this turn. Be specific — this reason will be shown to you on your next turn via <skip-rewind> so you can maintain continuity.")
    }
});
