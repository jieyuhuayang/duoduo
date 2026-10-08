// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: readNonNegativeNumberField  (minified: TW, daemon.pretty.js:71670)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readNonNegativeNumberField(e, t) {
    if (!isNonNullObject(e)) return;
    let n = e[t];
    return typeof n == "number" && Number.isFinite(n) && n >= 0 ? n : void 0
}
