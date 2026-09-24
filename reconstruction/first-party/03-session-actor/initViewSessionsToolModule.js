// duoduo reconstruction — subsystem: 03-session-actor
// symbol: initViewSessionsToolModule  (minified: xw, daemon.pretty.js:64274)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var kw, y_e, g$, y$, initViewSessionsToolModule = O(() => {
    "use strict";
    lc();
    dt();
    Dr();
    jV();
    Wr();
    xc();
    initJobManagerModule();
    kw = "ViewSessions", y_e = "mcp__aladuo__ViewSessions", g$ = `Read-only view of the sessions this daemon runs.

Call it with no argument to list every active session — key, alias, kind, and your own
line marked (you). That listing is how you find a target for Notify and the session_key
a job or an attachment needs.

Pass session_key to inspect one session instead: its status, cwd, workspace and the
filesystem paths behind it. This tool never creates, restores or modifies anything.`, y$ = {
        session_key: ft.string().describe("Session to inspect. Omit it to list every active session, including your own marked (you).").optional()
    }
});
