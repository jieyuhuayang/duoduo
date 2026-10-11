// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: stripBoardHtmlComments  (minified: rbt, daemon.pretty.js:82580)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.2 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.2 (medium): The runtime parses Claude Code's `@<file>` directives itself
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stripBoardHtmlComments(tokens) {
    let output = "";
    for (let token of tokens) {
        if (token.type === "html") {
            let raw = token.raw ?? "",
                trimmed = raw.trimStart();
            if (trimmed.startsWith("<!--") && trimmed.includes("-->")) {
                let stripped = raw.replace(DRe, "");
                stripped.trim() && (output += stripped);
                continue
            }
        }
        output += token.raw
    }
    return output
}
