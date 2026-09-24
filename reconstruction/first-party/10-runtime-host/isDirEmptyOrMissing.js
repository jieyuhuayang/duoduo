// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: isDirEmptyOrMissing  (minified: Sdt, daemon.pretty.js:69460)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function isDirEmptyOrMissing(e) {
    try {
        return (await tr.readdir(e)).length === 0
    } catch (t) {
        if (t.code === "ENOENT") return !0;
        throw t
    }
}
