// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildPiSystemPromptSpec  (minified: Eht, daemon.pretty.js:73045)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (high): the same kind/instance/job/partition prompt fields including append-or-replace
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildPiSystemPromptSpec(e) {
    if (!e) return;
    if (typeof e == "string") {
        let n = e.trim();
        return n ? {
            mode: "override",
            text: n
        } : void 0
    }
    let t = e.append?.trim();
    return t ? {
        mode: "append",
        text: t
    } : void 0
}
