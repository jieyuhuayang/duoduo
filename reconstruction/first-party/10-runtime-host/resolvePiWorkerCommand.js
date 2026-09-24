// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolvePiWorkerCommand  (minified: eS, daemon.pretty.js:72731)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolvePiWorkerCommand() {
    let e = zft(Uft(import.meta.url)),
        t = TH(e, "pi-worker.js");
    return Lft(t) ? {
        command: process.execPath,
        args: [t]
    } : {
        command: TH(e, "..", "..", "node_modules", ".bin", "tsx"),
        args: [TH(e, "pi", "worker.ts")]
    }
}
