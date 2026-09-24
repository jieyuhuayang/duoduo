// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: buildPiSystemPromptSpec  (minified: qft, daemon.pretty.js:72743)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
