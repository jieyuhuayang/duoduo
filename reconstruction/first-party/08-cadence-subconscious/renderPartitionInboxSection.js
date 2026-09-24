// duoduo reconstruction — subsystem: 08-cadence-subconscious
// symbol: renderPartitionInboxSection  (minified: Hgt, daemon.pretty.js:85809)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderPartitionInboxSection(e, t) {
    if (t.entries.length === 0) return "";
    let n = [];
    n.push(`## Inbox
`), n.push(`Inbox directory: ${e}/`), n.push("Messages addressed to this partition, oldest first. After processing each item, delete the corresponding file from this inbox directory to ack it."), n.push("");
    for (let r of t.entries) n.push(`- ${r.file}: ${r.message}`);
    return n.join(`
`)
}
