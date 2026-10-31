// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexTurnInput  (minified: YH, daemon.pretty.js:63551)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.7.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.0 (high): **Codex sessions accept inbound images** as first-class turn input rather than as a path the model has to open for itself.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexTurnInput(text, attachments) {
    let input = [{
        type: "text",
        text,
        text_elements: []
    }];
    for (let attachment of attachments ?? []) attachment.mime?.startsWith("image/") && (!attachment.path || !Lct.isAbsolute(attachment.path) || jct(attachment.path) && input.push({
        type: "localImage",
        path: attachment.path
    }));
    return input
}
