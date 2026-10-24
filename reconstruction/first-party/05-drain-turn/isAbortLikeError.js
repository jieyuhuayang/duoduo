// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: isAbortLikeError  (minified: kg, daemon.pretty.js:57366)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 2 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isAbortLikeError(error) {
    let seen = new Set,
        current = error;
    for (; current && typeof current == "object" && !seen.has(current);) {
        seen.add(current);
        let name = current.name,
            code = current.code;
        if (name === "AbortError" || code === "ABORT_ERR") return !0;
        current = current.cause
    }
    return !1
}
