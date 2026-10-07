// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: normalizeNotifyChannelTarget  (minified: fO, daemon.pretty.js:65019)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.8.0 (medium): Job results went nowhere when the job had no explicit audience; the owner is now the default, and a job can no longer disappear without a trace.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function normalizeNotifyChannelTarget(e) {
    let t = e.trim();
    if (!t || /\s/.test(t) || t.startsWith("session:") || t.startsWith("channel:")) return null;
    let n = t.indexOf(":");
    if (n <= 0 || n === t.length - 1) return null;
    let r = t.slice(0, n),
        i = t.slice(n + 1);
    return `${Flt[r]??r}:${i}`
}
