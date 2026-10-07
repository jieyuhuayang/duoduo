// duoduo reconstruction — subsystem: 09-memory
// symbol: renderOrphanIslandsBody  (minified: Oft, daemon.pretty.js:68742)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.5 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.5.5 (medium): A new cadence-driven memory lint measures the memory tree and routes convergence signals to the subconscious partitions. `ALADUO_EXP_MEMORY_CHECK=1` enables the measure-and-notify lints
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function renderOrphanIslandsBody(e, t, n, r = WO, i) {
    let o = ["[orphan-islands]", `scope: ${t}  (effectiveness/ excluded by default — not graph nodes)`, `${e.length} topics nodes are unreachable from the board closure but are NOT indeg=0 leaf junk;`, "each is referenced by something (an orphan island). Decide per node: wire it back into", "the board closure (add a reachable [[ref]]), or confirm it dead and clean the references.", `newborn = produced within ${r}h, may just not be wired yet — give it a round before triage.`];
    i && o.push(`touches = foreground reads of the node in the activation window (${zH(i)}); a touched island is in use now.`), o.push("", i ? "islands: slug | age | indeg | touches | referenced-by" : "islands: slug | age | indeg | referenced-by");
    for (let s of e) {
        let a = Pft(s.mtimeMs, n, r),
            u = s.referencedBy.length > 0 ? s.referencedBy.join(" ") + " " : "",
            l = i ? `touches=${i.touches.get(s.rel)??0} | ` : "";
        o.push(`- ${s.slug} | ${a} | indeg=${s.indeg} | ${l}${u}`)
    }
    return o.join(`
`) + `
`
}
