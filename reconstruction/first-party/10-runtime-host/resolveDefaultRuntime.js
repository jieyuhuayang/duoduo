// duoduo reconstruction — subsystem: 10-runtime-host
// symbol: resolveDefaultRuntime  (minified: yo, daemon.pretty.js:33910)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.4 (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (medium): it fails closed: asking for Grok when Grok is not usable gives you a clear error, never a silent fall back to Claude.
// changelog v0.8.4 (high): After the upgrade an unknown value in `ALADUO_DEFAULT_RUNTIME` stops the daemon from booting (an absent or empty value still means `claude`).
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function resolveDefaultRuntime(env = process.env) {
    let ALADUODEFAULTRUNTIME = env.ALADUO_DEFAULT_RUNTIME;
    if (typeof ALADUODEFAULTRUNTIME != "string") return "claude";
    let normalized = ALADUODEFAULTRUNTIME.trim().toLowerCase();
    if (normalized.length === 0) return "claude";
    let validation = validateRunnableRuntimeValue(normalized, "ALADUO_DEFAULT_RUNTIME");
    if (!validation.ok) throw new Mb(validation.reason);
    return validation.runtime ?? "claude"
}
