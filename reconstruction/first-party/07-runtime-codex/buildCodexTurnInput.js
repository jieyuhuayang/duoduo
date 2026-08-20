// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexTurnInput  (minified: E2, daemon.pretty.js:58863)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexTurnInput(e, t) {
    let n = [{
        type: "text",
        text: e,
        text_elements: []
    }];
    for (let r of t ?? []) r.mime?.startsWith("image/") && (!r.path || !OXe.isAbsolute(r.path) || CXe(r.path) && n.push({
        type: "localImage",
        path: r.path
    }));
    return n
}
