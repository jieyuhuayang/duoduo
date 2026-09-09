// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexTurnInput  (minified: J2, daemon.pretty.js:56717)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexTurnInput(e, t) {
    let n = [{
        type: "text",
        text: e,
        text_elements: []
    }];
    for (let r of t ?? []) r.mime?.startsWith("image/") && (!r.path || !het.isAbsolute(r.path) || met(r.path) && n.push({
        type: "localImage",
        path: r.path
    }));
    return n
}
