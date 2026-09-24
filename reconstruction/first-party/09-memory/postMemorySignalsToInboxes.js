// duoduo reconstruction — subsystem: 09-memory
// symbol: postMemorySignalsToInboxes  (minified: rO, daemon.pretty.js:67290)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
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
        Ya.mkdirSync(i, {
            recursive: !0
        });
        let o = Sg.join(i, r.pendingFilename);
        if (!t.force && Ya.existsSync(o)) {
            n.withheld.push({
                kind: r.kind,
                partition: r.partition,
                reason: "already-pending"
            });
            continue
        }
        if (t.force) Ya.writeFileSync(o, r.pendingBody, "utf8");
        else try {
            Ya.writeFileSync(o, r.pendingBody, {
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
