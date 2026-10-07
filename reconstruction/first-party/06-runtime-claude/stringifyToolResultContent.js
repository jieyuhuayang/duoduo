// duoduo reconstruction — subsystem: 06-runtime-claude
// symbol: stringifyToolResultContent  (minified: K$, daemon.pretty.js:55143)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function stringifyToolResultContent(e) {
    if (typeof e == "string") return e;
    if (Array.isArray(e)) return e.filter(t => t && typeof t == "object" && t.type === "text").map(t => t.text ?? "").filter(Boolean).join(`
`);
    try {
        return JSON.stringify(e) ?? ""
    } catch {
        return "[unparseable]"
    }
}
