// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: checkMainAliasCallerAuthority  (minified: qft, daemon.pretty.js:90202)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function checkMainAliasCallerAuthority(e, t, n) {
    if (!(e.caller_in_session === !0 || e.caller_session !== void 0)) return null;
    let i = vSe(t, e.display_name, e.move === !0),
        o = e.caller_session?.trim();
    if (!o) return {
        ok: !1,
        reason: "no_caller",
        session_key: t,
        error: `Changing which session is main is refused here: this command ran inside a session that could not be identified. Nothing was changed. Ask the owner to run it from their own terminal: ${i}`
    };
    if (n.state === "held" && n.session_key === o) return null;
    let s = n.state === "held" ? `the current main session (${n.session_key})` : "the current main session";
    return {
        ok: !1,
        reason: "not_main",
        session_key: t,
        error: `Only ${s} or the owner from their own terminal can change which session is main. Nothing was changed. Ask the owner to run it from their own terminal: ${i}`
    }
}
