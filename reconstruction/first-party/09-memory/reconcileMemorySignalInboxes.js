// duoduo reconstruction — subsystem: 09-memory
// symbol: reconcileMemorySignalInboxes  (minified: Xwe, daemon.pretty.js:67665)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// changelog v0.7.1 (medium): partition inboxes now have defined snapshot semantics, so a partition can no longer quietly lose or re-process work handed to it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function reconcileMemorySignalInboxes(e, t, n) {
    let r = {
            removed: [],
            errors: []
        },
        i = new Map;
    for (let o of $H) i.set(o, new Set);
    for (let o of e) try {
        if (!n.force && enforceContractGate(o.kind, getCachedPartitionContract(n, o.partition), n.flagFallback) !== null) continue;
        CH(o.pendingFilename) && i.get(o.partition)?.add(o.pendingFilename)
    } catch (s) {
        r.errors.push(`${o.kind} → ${o.partition}: ${String(s)}`)
    }
    for (let o of $H) try {
        let s = i.get(o) ?? new Set,
            a = partitionInboxDirFromVar(n.varDir, o);
        if (s.size === 0 && !su.existsSync(a)) continue;
        let u = new Set;
        for (let l of t) {
            if (Vg.dirname(l) !== a) continue;
            let c = Vg.basename(l);
            CH(c) && u.add(c)
        }
        for (let l of Odt(n.varDir, o)) {
            if (s.has(l)) {
                u.add(l);
                continue
            }
            let c = Vg.join(a, l);
            su.existsSync(c) && (su.rmSync(c, {
                force: !0
            }), r.removed.push(c))
        }
        su.mkdirSync(a, {
            recursive: !0
        }), su.writeFileSync(Ywe(n.varDir, o), `${JSON.stringify([...u].sort())}
`, "utf8")
    } catch (s) {
        r.errors.push(`${o}: ${String(s)}`)
    }
    return r
}
