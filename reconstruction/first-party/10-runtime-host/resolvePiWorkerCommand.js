// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolvePiWorkerCommand  (minified: $S, daemon.pretty.js:73033)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePiWorkerCommand() {
    let e = kht(xht(import.meta.url)),
        t = zW(e, "pi-worker.js");
    return wht(t) ? {
        command: process.execPath,
        args: [t]
    } : {
        command: zW(e, "..", "..", "node_modules", ".bin", "tsx"),
        args: [zW(e, "pi", "worker.ts")]
    }
}
