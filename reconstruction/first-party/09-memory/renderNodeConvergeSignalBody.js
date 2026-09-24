// duoduo reconstruction — subsystem: 09-memory
// symbol: renderNodeConvergeSignalBody  (minified: xlt, daemon.pretty.js:66997)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderNodeConvergeSignalBody(e) {
    let t = Q$(e),
        n = [`[node-converge] [[${t}]]`, `node: topics/${t}.md`];
    if (e.lines > E6 && n.push(`lines: ${e.lines} (over ${E6})`), e.unexpectedSectionCount > 0) {
        n.push(`unexpected-sections: ${e.unexpectedSectionCount}`);
        for (let r of e.unexpectedSections) n.push(`  - ## ${r}`)
    }
    return n.push(`reachable: ${e.reachable?"yes":"no"}`), e.escalated && n.push("escalated: WASTED-COMPUTE — walked-off AND board-unreachable; consider whether this node should exist before rewriting"), n.push(`action: revisit per your Node Format + Revisit discipline — converge to the bounded callable rule (## Condition / ## Procedure [/ ## References for groove]); absorb the provenance into the rule and let dated arcs/quotes/fragment paths fall out (history stays in fragments + kernel git). Keep [[${t}]] resolvable.`), n.join(`
`) + `
`
}
