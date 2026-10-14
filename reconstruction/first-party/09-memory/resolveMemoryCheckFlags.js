// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryCheckFlags  (minified: JH, daemon.pretty.js:68835)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (high): `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints; `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryCheckFlags() {
    let check = isTruthyEnvFlag("ALADUO_EXP_MEMORY_CHECK"),
        forget = isTruthyEnvFlag("ALADUO_EXP_MEMORY_FORGET") && check;
    return {
        check,
        forget
    }
}
