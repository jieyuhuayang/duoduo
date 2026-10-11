// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: sanitizeUploadFileName  (minified: lct, daemon.pretty.js:88258)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.7.0 (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function sanitizeUploadFileName(fileName) {
    let trimmedName = fileName.trim().length > 0 ? fileName.trim() : "file",
        safeName = Kf.basename(trimmedName).replace(/[\\/\0]/g, "_");
    return safeName.length === 0 || safeName === "." || safeName === ".." ? "file" : safeName
}
