// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readPiAgentSettings  (minified: OS, daemon.pretty.js:73452)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (high): A pi worker was torn down and rebuilt when its settings file merely failed to *read* — a transient error was treated as "not configured".
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readPiAgentSettings(e) {
    let t = {},
        n = "ask",
        r = [],
        i = !1,
        o;
    try {
        o = Oht(uEe.join(e, "settings.json"), "utf-8")
    } catch (s) {
        s?.code !== "ENOENT" && (i = !0)
    }
    if (o !== void 0) try {
        let s = JSON.parse(o),
            a = sEe(s);
        t = a.seed, r = a.unknown;
        let u = s.defaultProjectTrust;
        (u === "always" || u === "never" || u === "ask") && (n = u)
    } catch {}
    return {
        settingsSeed: t,
        defaultProjectTrust: n,
        unknownKeys: r,
        readFailed: i
    }
}
