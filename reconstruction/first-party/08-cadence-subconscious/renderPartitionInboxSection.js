// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderPartitionInboxSection  (minified: Tkt, daemon.pretty.js:88288)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.3 — first release whose bundle holds this declaration; body changed in v0.5.8, v0.8.0 (maps/history_daemon.json)
// locals: 4 renamed — 0 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderPartitionInboxSection(inboxDir, inbox) {
    if (inbox.entries.length === 0) return "";
    let lines = [];
    lines.push(`## Inbox
`), lines.push(`Inbox directory: ${inboxDir}/`), lines.push("Messages addressed to this partition, oldest first. After processing each item, delete the corresponding file from this inbox directory to ack it."), lines.push("");
    for (let entry of inbox.entries) lines.push(`- ${entry.file}: ${entry.message}`);
    return lines.join(`
`)
}
