// duoduo reconstruction — subsystem: 02-gateway-rpc
// symbol: sanitizeUploadFileName  (minified: lct, daemon.pretty.js:88258)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function sanitizeUploadFileName(e) {
    let t = e.trim().length > 0 ? e.trim() : "file",
        r = Kf.basename(t).replace(/[\\/\0]/g, "_");
    return r.length === 0 || r === "." || r === ".." ? "file" : r
}
