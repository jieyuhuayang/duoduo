// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: resolveCodexSandbox  (minified: $g, daemon.pretty.js:62165)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.4 (high): `ALADUO_CODEX_ENABLED` feature flag and `ALADUO_CODEX_SANDBOX` env var
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveCodexSandbox() {
    let e = process.env.ALADUO_CODEX_SANDBOX?.trim().toLowerCase();
    return e === "danger-full-access" ? "danger-full-access" : e === "read-only" ? "read-only" : "workspace-write"
}
