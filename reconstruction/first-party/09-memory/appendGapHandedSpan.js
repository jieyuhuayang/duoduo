// duoduo reconstruction — subsystem: 09-memory
// symbol: appendGapHandedSpan  (minified: nSe, daemon.pretty.js:67866)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function appendGapHandedSpan(varDir, span) {
    let memoryStateDir = zc.join(varDir, "memory");
    au.mkdirSync(memoryStateDir, {
        recursive: !0
    }), au.appendFileSync(zc.join(memoryStateDir, uSe), `${Wwe(span)}
`, "utf8")
}
