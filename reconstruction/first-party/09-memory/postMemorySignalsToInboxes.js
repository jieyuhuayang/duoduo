// duoduo reconstruction — subsystem: 09-memory
// symbol: postMemorySignalsToInboxes  (minified: zO, daemon.pretty.js:67581)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.5.8, v0.8.0 (maps/history_daemon.json)
// changelog v0.5.6 (high): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function postMemorySignalsToInboxes(e, t) {
    let n = {
        posted: [],
        withheld: [],
        errors: []
    };
    for (let r of e) try {
        if (!t.force) {
            let s = enforceContractGate(r.kind, getCachedPartitionContract(t, r.partition), t.flagFallback);
            if (s !== null) {
                n.withheld.push({
                    kind: r.kind,
                    partition: r.partition,
                    reason: s
                });
                continue
            }
        }
        let i = partitionInboxDirFromVar(t.varDir, r.partition);
        su.mkdirSync(i, {
            recursive: !0
        });
        let o = Vg.join(i, r.pendingFilename);
        if (!t.force && su.existsSync(o)) {
            n.withheld.push({
                kind: r.kind,
                partition: r.partition,
                reason: "already-pending"
            });
            continue
        }
        if (t.force) su.writeFileSync(o, r.pendingBody, "utf8");
        else try {
            su.writeFileSync(o, r.pendingBody, {
                encoding: "utf8",
                flag: "wx"
            })
        } catch (s) {
            if (s?.code !== "EEXIST") throw s;
            n.withheld.push({
                kind: r.kind,
                partition: r.partition,
                reason: "already-pending"
            });
            continue
        }
        n.posted.push(o)
    } catch (i) {
        n.errors.push(`${r.kind} → ${r.partition}/${r.pendingFilename}: ${String(i)}`)
    }
    return n
}
