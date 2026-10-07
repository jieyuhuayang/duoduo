// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: stripBoardHtmlComments  (minified: rbt, daemon.pretty.js:82580)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripBoardHtmlComments(e) {
    let t = "";
    for (let n of e) {
        if (n.type === "html") {
            let r = n.raw ?? "",
                i = r.trimStart();
            if (i.startsWith("<!--") && i.includes("-->")) {
                let o = r.replace(DRe, "");
                o.trim() && (t += o);
                continue
            }
        }
        t += n.raw
    }
    return t
}
