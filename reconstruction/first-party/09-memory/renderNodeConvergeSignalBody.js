// duoduo reconstruction — subsystem: 09-memory
// symbol: renderNodeConvergeSignalBody  (minified: _dt, daemon.pretty.js:67269)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNodeConvergeSignalBody(e) {
    let t = buildNodeSignalKey(e),
        n = [`[node-converge] [[${t}]]`, `node: topics/${t}.md`];
    if (e.lines > xH && n.push(`lines: ${e.lines} (over ${xH})`), e.unexpectedSectionCount > 0) {
        n.push(`unexpected-sections: ${e.unexpectedSectionCount}`);
        for (let r of e.unexpectedSections) n.push(`  - ## ${r}`)
    }
    return n.push(`reachable: ${e.reachable?"yes":"no"}`), e.escalated && n.push("escalated: WASTED-COMPUTE — walked-off AND board-unreachable; consider whether this node should exist before rewriting"), n.push(`action: revisit per your Node Format + Revisit discipline — converge to the bounded callable rule (## Condition / ## Procedure [/ ## References for groove]); absorb the provenance into the rule and let dated arcs/quotes/fragment paths fall out (history stays in fragments + kernel git). Keep [[${t}]] resolvable.`), n.join(`
`) + `
`
}
