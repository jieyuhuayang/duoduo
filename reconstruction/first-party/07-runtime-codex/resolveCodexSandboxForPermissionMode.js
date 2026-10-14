// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: resolveCodexSandboxForPermissionMode  (minified: $ut, daemon.pretty.js:62756)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.4.4 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 2 renamed — 0 from the code at the binding (rule), 2 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.4.4 (medium): `ALADUO_CODEX_ENABLED` feature flag and `ALADUO_CODEX_SANDBOX` env var
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveCodexSandboxForPermissionMode(permissionMode, defaultSandbox) {
    switch (permissionMode) {
        case "bypassPermissions":
        case "acceptEdits":
        case "dontAsk":
            return "workspace-write";
        case "plan":
            return "read-only";
        default:
            return defaultSandbox ?? "read-only"
    }
}
