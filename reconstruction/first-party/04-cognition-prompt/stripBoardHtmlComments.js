// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: stripBoardHtmlComments  (minified: vgt, daemon.pretty.js:82278)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripBoardHtmlComments(e) {
    let t = "";
    for (let n of e) {
        if (n.type === "html") {
            let r = n.raw ?? "",
                i = r.trimStart();
            if (i.startsWith("<!--") && i.includes("-->")) {
                let o = r.replace(HEe, "");
                o.trim() && (t += o);
                continue
            }
        }
        t += n.raw
    }
    return t
}
