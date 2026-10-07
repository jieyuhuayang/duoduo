// duoduo reconstruction — subsystem: 09-memory
// symbol: isSafeMemorySlug  (minified: kH, daemon.pretty.js:67134)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function isSafeMemorySlug(e) {
    return !(e.length === 0 || e.includes("/") || e.includes("\\") || e.includes("\0") || e === ".." || e === ".")
}
