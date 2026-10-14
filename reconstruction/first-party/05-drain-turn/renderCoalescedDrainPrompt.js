// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderCoalescedDrainPrompt  (minified: nht, daemon.pretty.js:72274)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.1 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderCoalescedDrainPrompt(entries) {
    if (entries.length === 1) return entries[0].prompt;
    let lines = [`Process these ${entries.length} closely timed events as one continuous update.`, "Events are ordered from oldest to newest. Reply once.", ""];
    for (let [index, entry] of entries.entries()) lines.push(`Event ${index+1}: @evt(${entry.event.id}) ${entry.event.type} ${entry.event.ts}`), lines.push(entry.prompt || "(empty)"), lines.push("");
    return lines.join(`
`).trimEnd()
}
