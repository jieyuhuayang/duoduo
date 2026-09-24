// duoduo reconstruction — subsystem: 09-memory
// symbol: reconcileMemorySignalInboxes  (minified: Mve, daemon.pretty.js:67374)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function reconcileMemorySignalInboxes(e, t, n) {
    let r = {
            removed: [],
            errors: []
        },
        i = new Map;
    for (let o of C6) i.set(o, new Set);
    for (let o of e) try {
        if (!n.force && enforceContractGate(o.kind, getCachedPartitionContract(n, o.partition), n.flagFallback) !== null) continue;
        $6(o.pendingFilename) && i.get(o.partition)?.add(o.pendingFilename)
    } catch (s) {
        r.errors.push(`${o.kind} → ${o.partition}: ${String(s)}`)
    }
    for (let o of C6) try {
        let s = i.get(o) ?? new Set,
            a = partitionInboxDirFromVar(n.varDir, o);
        if (s.size === 0 && !Ya.existsSync(a)) continue;
        let u = new Set;
        for (let l of t) {
            if (Sg.dirname(l) !== a) continue;
            let c = Sg.basename(l);
            $6(c) && u.add(c)
        }
        for (let l of jlt(n.varDir, o)) {
            if (s.has(l)) {
                u.add(l);
                continue
            }
            let c = Sg.join(a, l);
            Ya.existsSync(c) && (Ya.rmSync(c, {
                force: !0
            }), r.removed.push(c))
        }
        Ya.mkdirSync(a, {
            recursive: !0
        }), Ya.writeFileSync(Dve(n.varDir, o), `${JSON.stringify([...u].sort())}
`, "utf8")
    } catch (s) {
        r.errors.push(`${o}: ${String(s)}`)
    }
    return r
}
