// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: warnUnmappedCodexItemOnce  (minified: hbe, daemon.pretty.js:62846)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function warnUnmappedCodexItemOnce(e, t) {
    let n = `${e}:${t}`;
    obe.has(n) || (obe.add(n), logAlwaysAtLevel("info", "[codex] item/" + e + " has no execution-event mapping — dropping silently", {
        phase: e,
        type: t
    }))
}
