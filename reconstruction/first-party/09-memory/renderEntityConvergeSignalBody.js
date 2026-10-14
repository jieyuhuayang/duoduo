// duoduo reconstruction — subsystem: 09-memory
// symbol: renderEntityConvergeSignalBody  (minified: gdt, daemon.pretty.js:67197)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 3 renamed — 0 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderEntityConvergeSignalBody(row) {
    let reachability = row.reachable ? "reachable" : "unreachable",
        lines = [`[entity-converge] [[${row.slug}]]`, `node: memory/entities/${row.slug}.md`, `shape: ${row.kb}K, ${row.lines} lines, ${row.dated} dated stamps, ${reachability} from board — append-log, not the bounded current picture`, `action: revisit per your current-picture discipline — whole-file overwrite into the bounded picture (## What it is now / Relationship / Open variables, plus ## Trend only when the name is monitored; modal-tagged), collapse the dated chronology into the current state (history stays in Spine + kernel git; read with git log -p if needed). Keep [[${row.slug}]] resolvable.`];
    return row.reachable || lines.push("note: this entity is NOT reachable from the board closure — it has no current effect on the foreground. If the picture comes out empty of any still-relevant prior, it is a dead card; say so rather than manufacturing content."), lines.join(`
`) + `
`
}
