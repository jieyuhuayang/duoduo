// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: resolveCodexSandboxForPermissionMode  (minified: Nst, daemon.pretty.js:62436)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
