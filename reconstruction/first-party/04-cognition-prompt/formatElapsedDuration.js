// duoduo reconstruction — subsystem: 04-cognition-prompt
// symbol: formatElapsedDuration  (minified: Hxe, daemon.pretty.js:71923)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.3.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 6 renamed — 0 from the code at the binding (rule), 6 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.3.0 (medium): **runner**: Add configurable time-gap session context and upgrade runtime prompt assembly to structured content blocks.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function formatElapsedDuration(ms) {
    let minutes = Math.round(ms / 6e4);
    if (minutes < 60) return `${minutes} minute${minutes!==1?"s":""}`;
    let hours = Math.floor(minutes / 60),
        remainingMinutes = minutes % 60;
    if (hours < 24) return remainingMinutes === 0 ? hours === 1 ? "1 hour" : `${hours} hours` : `${hours} hour${hours>1?"s":""} and ${remainingMinutes} minute${remainingMinutes>1?"s":""}`;
    let days = Math.floor(hours / 24),
        remainingHours = hours % 24;
    return remainingHours === 0 ? days === 1 ? "1 day" : `${days} days` : `${days} day${days>1?"s":""} and ${remainingHours} hour${remainingHours>1?"s":""}`
}
