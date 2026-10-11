// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: eventToMessageGenerator  (minified: bV, daemon.pretty.js:55474)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.3.0 (maps/history_daemon.json)
// locals: 9 renamed — 0 from the code at the binding (rule), 9 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function* eventToMessageGenerator(text, attachments, attachmentOptions) {
    let attachmentBlocks = [];
    if (attachments && attachments.length > 0)
        for (let attachment of attachments) {
            let attachmentBlock = wot(attachment, attachmentOptions);
            attachmentBlock && attachmentBlocks.push(attachmentBlock)
        }
    let textBlocks = typeof text == "string" ? text ? [{
        type: "text",
        text
    }] : [] : text.filter(part => part.text).map(part => ({
        type: "text",
        text: part.text
    }));
    attachmentBlocks.length > 0 || textBlocks.length > 1 ? yield {
        type: "user",
        message: {
            role: "user",
            content: [...textBlocks, ...attachmentBlocks]
        }
    } : yield {
        type: "user",
        message: {
            role: "user",
            content: textBlocks.length > 0 ? textBlocks[0].text : ""
        }
    }
}
