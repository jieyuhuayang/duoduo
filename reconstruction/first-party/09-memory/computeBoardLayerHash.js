// duoduo reconstruction — subsystem: 09-memory
// symbol: computeBoardLayerHash  (minified: wG, daemon.pretty.js:82655)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function computeBoardLayerHash(e) {
    return FRe("sha256").update(JSON.stringify([e ?? ""])).digest("hex")
}
