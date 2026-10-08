// duoduo reconstruction — subsystem: 00-daemon-entry
// symbol: computeRuntimeId  (minified: Xbt, daemon.pretty.js:90681)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeRuntimeId(e) {
    let t = so.resolve(e);
    return `rt_${AN.createHash("sha256").update(t).digest("hex").slice(0,12)}`
}
