// duoduo reconstruction — subsystem: 09-memory
// symbol: reconcileMemorySignalInboxes  (minified: tSe, daemon.pretty.js:67666)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.7.1 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// locals: 17 renamed — 3 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.7.1 (medium): partition inboxes now have defined snapshot semantics, so a partition can no longer quietly lose or re-process work handed to it.
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function reconcileMemorySignalInboxes(signals, postedPaths, ctx) {
    let result = {
            removed: [],
            errors: []
        },
        map = new Map;
    for (let partition of CH) map.set(partition, new Set);
    for (let signal of signals) try {
        if (!ctx.force && enforceContractGate(signal.kind, getCachedPartitionContract(ctx, signal.partition), ctx.flagFallback) !== null) continue;
        OH(signal.pendingFilename) && map.get(signal.partition)?.add(signal.pendingFilename)
    } catch (err) {
        result.errors.push(`${signal.kind} → ${signal.partition}: ${String(err)}`)
    }
    for (let partition of CH) try {
        let expected = map.get(partition) ?? new Set,
            inboxDir = partitionInboxDirFromVar(ctx.varDir, partition);
        if (expected.size === 0 && !su.existsSync(inboxDir)) continue;
        let keep = new Set;
        for (let postedPath of postedPaths) {
            if (Vg.dirname(postedPath) !== inboxDir) continue;
            let fileName = Vg.basename(postedPath);
            OH(fileName) && keep.add(fileName)
        }
        for (let pendingName of Ndt(ctx.varDir, partition)) {
            if (expected.has(pendingName)) {
                keep.add(pendingName);
                continue
            }
            let pendingPath = Vg.join(inboxDir, pendingName);
            su.existsSync(pendingPath) && (su.rmSync(pendingPath, {
                force: !0
            }), result.removed.push(pendingPath))
        }
        su.mkdirSync(inboxDir, {
            recursive: !0
        }), su.writeFileSync(eSe(ctx.varDir, partition), `${JSON.stringify([...keep].sort())}
`, "utf8")
    } catch (err) {
        result.errors.push(`${partition}: ${String(err)}`)
    }
    return result
}
