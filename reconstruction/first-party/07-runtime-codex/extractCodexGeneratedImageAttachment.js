// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: extractCodexGeneratedImageAttachment  (minified: uwe, daemon.pretty.js:64878)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.0 — first release whose bundle holds this declaration; body changed in v0.5.7 (maps/history_daemon.json)
// locals: 9 renamed — 1 from the code at the binding (rule), 8 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.0 (medium): Runtime image output delivery no longer duplicates attachments.
// changelog v0.5.7 (medium): Codex image generation delivered reliably (Codex 0.140+).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function extractCodexGeneratedImageAttachment(root) {
    let stack = [root],
        visited = new Set;
    for (; stack.length > 0;) {
        let node = stack.pop();
        if (!(!isCodexPlainObject(node) || visited.has(node))) {
            if (visited.add(node), isImageGenerationItemType(node)) {
                let savedPath = node.saved_path ?? node.savedPath;
                if (typeof savedPath == "string" && savedPath.trim().length > 0) return {
                    path: savedPath,
                    mime: "image/png"
                };
                let result = node.result,
                    callId = node.call_id ?? node.callId ?? node.id;
                if (typeof result == "string" && result.trim().length > 0 && typeof callId == "string" && callId.trim().length > 0) return {
                    inlineBase64: result.trim(),
                    callId: callId.trim()
                }
            }
            for (let key of ["payload", "event", "msg", "item"]) {
                let child = node[key];
                isCodexPlainObject(child) && stack.push(child)
            }
        }
    }
    return null
}
