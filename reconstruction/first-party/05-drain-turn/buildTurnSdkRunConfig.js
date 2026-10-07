// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: buildTurnSdkRunConfig  (minified: Fxe, daemon.pretty.js:70627)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.10, v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildTurnSdkRunConfig(e, t) {
    let n = (l, c) => c !== void 0 ? Rmt(l, c) : jxe(l),
        r = n(e.allowedTools, t?.allowedTools),
        i = n(e.disallowedTools, t?.disallowedTools),
        o = new Set(r ?? []),
        s = i?.filter(l => !o.has(l)),
        a = n(e.tools, t?.claudeTools),
        u = n(e.additionalDirectories, t?.additionalDirectories);
    return {
        allowedTools: r,
        disallowedTools: s,
        tools: a,
        additionalDirectories: u,
        permissionMode: e.permissionMode
    }
}
