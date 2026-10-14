// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: buildCodexStringInputSchema  (minified: vy, daemon.pretty.js:80393)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in v0.5.2 (maps/history_daemon.json)
// locals: 7 renamed — 0 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (medium): Dynamic tools bridge: aladuo MCP tools available to Codex sessions
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function buildCodexStringInputSchema(shape) {
    let properties = {},
        required = [];
    for (let [key, value] of Object.entries(shape)) {
        let schema = value,
            description = schema.description ?? schema.unwrap?.()?.description;
        schema.safeParse?.(void 0)?.success === !0 || required.push(key), properties[key] = {
            type: "string",
            ...description ? {
                description
            } : {}
        }
    }
    return {
        type: "object",
        properties,
        required
    }
}
