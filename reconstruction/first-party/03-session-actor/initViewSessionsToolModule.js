// duoduo reconstruction — subsystem: 03-session-actor
// symbol: initViewSessionsToolModule  (minified: yS, daemon.pretty.js:66248)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.2 (high): `ManageSession` is now `ViewSessions`.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var gS, gwe, xO, EO, initViewSessionsToolModule = A(() => {
    "use strict";
    Rc();
    initLogLevelModule();
    Rr();
    kO();
    ti();
    ca();
    initJobManagerModule();
    gS = "ViewSessions", gwe = "mcp__aladuo__ViewSessions", xO = `Read-only view of the sessions this daemon runs.

Call it with no argument to list every active session — key, alias, kind, and your own
line marked (you). That listing is how you find a target for Notify and the session_key
a job or an attachment needs.

Pass session_key to inspect one session instead: its status, cwd, workspace and the
filesystem paths behind it. This tool never creates, restores or modifies anything.`, EO = {
        session_key: ht.string().describe("Session to inspect. Omit it to list every active session, including your own marked (you).").optional()
    }
});
