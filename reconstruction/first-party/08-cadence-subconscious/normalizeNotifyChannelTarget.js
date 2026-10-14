// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: normalizeNotifyChannelTarget  (minified: fO, daemon.pretty.js:65020)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): Job results went nowhere when the job had no explicit audience; the owner is now the default, and a job can no longer disappear without a trace.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeNotifyChannelTarget(target) {
    let trimmed = target.trim();
    if (!trimmed || /\s/.test(trimmed) || trimmed.startsWith("session:") || trimmed.startsWith("channel:")) return null;
    let colonIndex = trimmed.indexOf(":");
    if (colonIndex <= 0 || colonIndex === trimmed.length - 1) return null;
    let prefix = trimmed.slice(0, colonIndex),
        rest = trimmed.slice(colonIndex + 1);
    return `${Ult[prefix]??prefix}:${rest}`
}
