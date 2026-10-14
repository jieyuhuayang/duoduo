// duoduo reconstruction — subsystem: 09-memory
// symbol: initKernelGitModule  (minified: Dke, daemon.pretty.js:69315)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.5.3, v0.8.0 (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var $ke, Cke, qpt, initKernelGitModule = O(() => {
    "use strict";
    initLogLevelModule();
    $ke = Upt(Fpt), Cke = `# Runtime state (not part of cognitive evolution)
memory/state/
memory/fragments/
memory/effectiveness/
subconscious/inbox/
.claude/
*.tmp
CLAUDE.local.md
# Model-profile config can embed credential-shaped values; keep it out of history
config/runtime.md
`, qpt = Cke.split(`
`).map(line => line.trim()).filter(entry => entry.length > 0 && !entry.startsWith("#"))
});
