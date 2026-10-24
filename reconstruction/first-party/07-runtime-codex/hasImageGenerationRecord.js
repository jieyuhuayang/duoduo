// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: hasImageGenerationRecord  (minified: awe, daemon.pretty.js:64862)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.7 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.7 (medium): Generated images produced by Codex were sometimes silently dropped; they are now delivered correctly, including the newer inline-image result shape.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function hasImageGenerationRecord(root) {
    let stack = [root],
        visited = new Set;
    for (; stack.length > 0;) {
        let node = stack.pop();
        if (!(!isCodexPlainObject(node) || visited.has(node))) {
            if (visited.add(node), isImageGenerationItemType(node)) return !0;
            for (let key of ["payload", "event", "msg", "item"]) {
                let child = node[key];
                isCodexPlainObject(child) && stack.push(child)
            }
        }
    }
    return !1
}
