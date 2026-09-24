// duoduo reconstruction — subsystem: 09-memory
// symbol: appendGapHandedSpan  (minified: zve, daemon.pretty.js:67575)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function appendGapHandedSpan(e, t) {
    let n = Cc.join(e, "memory");
    Xa.mkdirSync(n, {
        recursive: !0
    }), Xa.appendFileSync(Cc.join(n, Wve), `${Tve(t)}
`, "utf8")
}
