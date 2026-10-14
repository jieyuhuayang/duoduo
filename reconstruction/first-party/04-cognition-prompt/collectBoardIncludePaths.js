// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: collectBoardIncludePaths  (minified: ubt, daemon.pretty.js:82643)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 13 renamed — 1 from the code at the binding (rule), 12 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function collectBoardIncludePaths(tokens, filePath) {
    let includePaths = new Set,
        scanText = text => {
            NRe.lastIndex = 0;
            let match;
            for (;
                (match = NRe.exec(text)) !== null;) {
                let boardIncludeToken = normalizeBoardIncludeToken(match[1]);
                !boardIncludeToken || !isBoardIncludePathCandidate(boardIncludeToken) || includePaths.add(resolveBoardIncludePath(boardIncludeToken, ba.dirname(filePath)))
            }
        },
        walkTokens = tokenList => {
            for (let token of tokenList)
                if (!(token.type === "code" || token.type === "codespan")) {
                    if (token.type === "html") {
                        let raw = token.raw ?? "",
                            trimmed = raw.trimStart();
                        if (trimmed.startsWith("<!--") && trimmed.includes("-->")) {
                            let stripped = raw.replace(LRe, "");
                            stripped.trim() && scanText(stripped)
                        }
                        continue
                    }
                    token.type === "text" && scanText(String("text" in token ? token.text : "")), token.tokens && walkTokens(token.tokens), token.items && walkTokens(token.items)
                }
        };
    return walkTokens(tokens), [...includePaths]
}
