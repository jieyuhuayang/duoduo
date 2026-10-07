// duoduo reconstruction — subsystem: 03-session-actor
// symbol: readSessionMetaFile  (minified: na, daemon.pretty.js:35631)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function readSessionMetaFile(e, t) {
    try {
        let n = await qa.readFile(resolveSessionMetaPath(e, t), "utf8"),
            r = (0, Gb.default)(n, Sr).data;
        return r.session_key !== t || r.display_name !== void 0 && typeof r.display_name != "string" || typeof r.kind != "string" ? null : r
    } catch {
        return null
    }
}
