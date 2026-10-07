// duoduo reconstruction — subsystem: 09-memory
// symbol: renderEntityConvergeSignalBody  (minified: mdt, daemon.pretty.js:67196)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderEntityConvergeSignalBody(e) {
    let t = e.reachable ? "reachable" : "unreachable",
        n = [`[entity-converge] [[${e.slug}]]`, `node: memory/entities/${e.slug}.md`, `shape: ${e.kb}K, ${e.lines} lines, ${e.dated} dated stamps, ${t} from board — append-log, not the bounded current picture`, `action: revisit per your current-picture discipline — whole-file overwrite into the bounded picture (## What it is now / Relationship / Open variables, plus ## Trend only when the name is monitored; modal-tagged), collapse the dated chronology into the current state (history stays in Spine + kernel git; read with git log -p if needed). Keep [[${e.slug}]] resolvable.`];
    return e.reachable || n.push("note: this entity is NOT reachable from the board closure — it has no current effect on the foreground. If the picture comes out empty of any still-relevant prior, it is a dead card; say so rather than manufacturing content."), n.join(`
`) + `
`
}
