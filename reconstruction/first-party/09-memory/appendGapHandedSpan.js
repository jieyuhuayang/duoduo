// duoduo reconstruction — subsystem: 09-memory
// symbol: appendGapHandedSpan  (minified: vke, daemon.pretty.js:69065)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function appendGapHandedSpan(varDir, span) {
    let memoryStateDir = Wc.join(varDir, "memory");
    du.mkdirSync(memoryStateDir, {
        recursive: !0
    }), du.appendFileSync(Wc.join(memoryStateDir, Rke), `${cke(span)}
`, "utf8")
}
