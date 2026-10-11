// duoduo reconstruction — subsystem: 09-memory
// symbol: renderNodeConvergeSignalBody  (minified: _dt, daemon.pretty.js:67269)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 4 renamed — 1 from the code at the binding (rule), 3 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNodeConvergeSignalBody(row) {
    let nodeSignalKey = buildNodeSignalKey(row),
        lines = [`[node-converge] [[${nodeSignalKey}]]`, `node: topics/${nodeSignalKey}.md`];
    if (row.lines > xH && lines.push(`lines: ${row.lines} (over ${xH})`), row.unexpectedSectionCount > 0) {
        lines.push(`unexpected-sections: ${row.unexpectedSectionCount}`);
        for (let section of row.unexpectedSections) lines.push(`  - ## ${section}`)
    }
    return lines.push(`reachable: ${row.reachable?"yes":"no"}`), row.escalated && lines.push("escalated: WASTED-COMPUTE — walked-off AND board-unreachable; consider whether this node should exist before rewriting"), lines.push(`action: revisit per your Node Format + Revisit discipline — converge to the bounded callable rule (## Condition / ## Procedure [/ ## References for groove]); absorb the provenance into the rule and let dated arcs/quotes/fragment paths fall out (history stays in fragments + kernel git). Keep [[${nodeSignalKey}]] resolvable.`), lines.join(`
`) + `
`
}
