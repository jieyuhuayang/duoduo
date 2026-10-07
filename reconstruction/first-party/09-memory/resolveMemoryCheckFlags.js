// duoduo reconstruction — subsystem: 09-memory
// symbol: resolveMemoryCheckFlags  (minified: WH, daemon.pretty.js:68834)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (high): `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints; `ALADUO_EXP_MEMORY_FORGET=1` additionally lets it remove long-stale, board-unreachable orphan nodes (git-recoverable).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveMemoryCheckFlags() {
    let e = isTruthyEnvFlag("ALADUO_EXP_MEMORY_CHECK"),
        t = isTruthyEnvFlag("ALADUO_EXP_MEMORY_FORGET") && e;
    return {
        check: e,
        forget: t
    }
}
