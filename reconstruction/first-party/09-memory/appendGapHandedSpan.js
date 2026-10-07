// duoduo reconstruction — subsystem: 09-memory
// symbol: appendGapHandedSpan  (minified: nSe, daemon.pretty.js:67866)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function appendGapHandedSpan(e, t) {
    let n = zc.join(e, "memory");
    au.mkdirSync(n, {
        recursive: !0
    }), au.appendFileSync(zc.join(n, uSe), `${Wwe(t)}
`, "utf8")
}
