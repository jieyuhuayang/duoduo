// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: renderCoalescedDrainPrompt  (minified: yft, daemon.pretty.js:71971)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderCoalescedDrainPrompt(e) {
    if (e.length === 1) return e[0].prompt;
    let t = [`Process these ${e.length} closely timed events as one continuous update.`, "Events are ordered from oldest to newest. Reply once.", ""];
    for (let [n, r] of e.entries()) t.push(`Event ${n+1}: @evt(${r.event.id}) ${r.event.type} ${r.event.ts}`), t.push(r.prompt || "(empty)"), t.push("");
    return t.join(`
`).trimEnd()
}
