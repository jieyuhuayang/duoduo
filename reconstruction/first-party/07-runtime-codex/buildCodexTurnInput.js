// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexTurnInput  (minified: xV, daemon.pretty.js:61961)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexTurnInput(e, t) {
    let n = [{
        type: "text",
        text: e,
        text_elements: []
    }];
    for (let r of t ?? []) r.mime?.startsWith("image/") && (!r.path || !Ist.isAbsolute(r.path) || Rst(r.path) && n.push({
        type: "localImage",
        path: r.path
    }));
    return n
}
