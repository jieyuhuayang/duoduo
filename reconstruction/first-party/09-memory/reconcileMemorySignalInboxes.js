// duoduo reconstruction — subsystem: 09-memory
// symbol: reconcileMemorySignalInboxes  (minified: Jke, daemon.pretty.js:69748)
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
    for (let partition of dW) map.set(partition, new Set);
    for (let signal of signals) try {
        if (!ctx.force && enforceContractGate(signal.kind, getCachedPartitionContract(ctx, signal.partition), ctx.flagFallback) !== null) continue;
        fW(signal.pendingFilename) && map.get(signal.partition)?.add(signal.pendingFilename)
    } catch (err) {
        result.errors.push(`${signal.kind} → ${signal.partition}: ${String(err)}`)
    }
    for (let partition of dW) try {
        let expected = map.get(partition) ?? new Set,
            inboxDir = partitionInboxDirFromVar(ctx.varDir, partition);
        if (expected.size === 0 && !uu.existsSync(inboxDir)) continue;
        let keep = new Set;
        for (let postedPath of postedPaths) {
            if (Qg.dirname(postedPath) !== inboxDir) continue;
            let fileName = Qg.basename(postedPath);
            fW(fileName) && keep.add(fileName)
        }
        for (let pendingName of $ht(ctx.varDir, partition)) {
            if (expected.has(pendingName)) {
                keep.add(pendingName);
                continue
            }
            let pendingPath = Qg.join(inboxDir, pendingName);
            uu.existsSync(pendingPath) && (uu.rmSync(pendingPath, {
                force: !0
            }), result.removed.push(pendingPath))
        }
        uu.mkdirSync(inboxDir, {
            recursive: !0
        }), uu.writeFileSync(Wke(ctx.varDir, partition), `${JSON.stringify([...keep].sort())}
`, "utf8")
    } catch (err) {
        result.errors.push(`${partition}: ${String(err)}`)
    }
    return result
}
