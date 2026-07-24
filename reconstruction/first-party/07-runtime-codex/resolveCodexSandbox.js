// duoduo reconstruction — subsystem: 07-runtime-codex
// symbol: resolveCodexSandbox  (minified: Gp, daemon.pretty.js:57762)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveCodexSandbox() {
 let e = process.env.ALADUO_CODEX_SANDBOX?.trim()
  .toLowerCase();
 return e === "danger-full-access" ? "danger-full-access" : e === "read-only" ? "read-only" : "workspace-write"
}
