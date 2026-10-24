// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readSessionMetaFile  (minified: ra, daemon.pretty.js:37713)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.4 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 4 renamed — 2 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readSessionMetaFile(paths, sessionKey) {
    try {
        let content = await Ha.readFile(resolveSessionMetaPath(paths, sessionKey), "utf8"),
            data = (0, sv.default)(content, kr).data;
        return data.session_key !== sessionKey || data.display_name !== void 0 && typeof data.display_name != "string" || typeof data.kind != "string" ? null : data
    } catch {
        return null
    }
}
