// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: collectBoardIncludePaths  (minified: ibt, daemon.pretty.js:82597)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectBoardIncludePaths(e, t) {
    let n = new Set,
        r = o => {
            CRe.lastIndex = 0;
            let s;
            for (;
                (s = CRe.exec(o)) !== null;) {
                let a = normalizeBoardIncludeToken(s[1]);
                !a || !isBoardIncludePathCandidate(a) || n.add(resolveBoardIncludePath(a, ba.dirname(t)))
            }
        },
        i = o => {
            for (let s of o)
                if (!(s.type === "code" || s.type === "codespan")) {
                    if (s.type === "html") {
                        let a = s.raw ?? "",
                            u = a.trimStart();
                        if (u.startsWith("<!--") && u.includes("-->")) {
                            let l = a.replace(DRe, "");
                            l.trim() && r(l)
                        }
                        continue
                    }
                    s.type === "text" && r(String("text" in s ? s.text : "")), s.tokens && i(s.tokens), s.items && i(s.items)
                }
        };
    return i(e), [...n]
}
