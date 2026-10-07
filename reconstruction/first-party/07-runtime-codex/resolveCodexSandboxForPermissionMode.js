// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: resolveCodexSandboxForPermissionMode  (minified: Tut, daemon.pretty.js:62755)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.4.4 (medium): `ALADUO_CODEX_ENABLED` feature flag and `ALADUO_CODEX_SANDBOX` env var
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveCodexSandboxForPermissionMode(e, t) {
    switch (e) {
        case "bypassPermissions":
        case "acceptEdits":
        case "dontAsk":
            return "workspace-write";
        case "plan":
            return "read-only";
        default:
            return t ?? "read-only"
    }
}
