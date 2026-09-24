// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: collectBoardIncludePaths  (minified: wgt, daemon.pretty.js:82295)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectBoardIncludePaths(e, t) {
    let n = new Set,
        r = o => {
            UEe.lastIndex = 0;
            let s;
            for (;
                (s = UEe.exec(o)) !== null;) {
                let a = normalizeBoardIncludeToken(s[1]);
                !a || !isBoardIncludePathCandidate(a) || n.add(resolveBoardIncludePath(a, ha.dirname(t)))
            }
        },
        i = o => {
            for (let s of o)
                if (!(s.type === "code" || s.type === "codespan")) {
                    if (s.type === "html") {
                        let a = s.raw ?? "",
                            u = a.trimStart();
                        if (u.startsWith("<!--") && u.includes("-->")) {
                            let l = a.replace(HEe, "");
                            l.trim() && r(l)
                        }
                        continue
                    }
                    s.type === "text" && r(String("text" in s ? s.text : "")), s.tokens && i(s.tokens), s.items && i(s.items)
                }
        };
    return i(e), [...n]
}
