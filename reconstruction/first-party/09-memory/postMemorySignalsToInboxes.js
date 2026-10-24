// duoduo reconstruction — subsystem: 09-memory
// symbol: postMemorySignalsToInboxes  (minified: nA, daemon.pretty.js:69664)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.6 — first release whose bundle holds this declaration; body changed in v0.5.8, v0.8.0 (maps/history_daemon.json)
// locals: 9 renamed — 2 from the code at the binding (rule), 7 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.5.6 (high): Each subconscious partition declares which `.pending` signal kinds it consumes in its `contract:` frontmatter. The memory-check delivery layer validates the declaration before posting — an undeclared signal kind is withheld
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function postMemorySignalsToInboxes(signals, ctx) {
    let result = {
        posted: [],
        withheld: [],
        errors: []
    };
    for (let signal of signals) try {
        if (!ctx.force) {
            let reason = enforceContractGate(signal.kind, getCachedPartitionContract(ctx, signal.partition), ctx.flagFallback);
            if (reason !== null) {
                result.withheld.push({
                    kind: signal.kind,
                    partition: signal.partition,
                    reason
                });
                continue
            }
        }
        let inboxDir = partitionInboxDirFromVar(ctx.varDir, signal.partition);
        uu.mkdirSync(inboxDir, {
            recursive: !0
        });
        let pendingPath = Qg.join(inboxDir, signal.pendingFilename);
        if (!ctx.force && uu.existsSync(pendingPath)) {
            result.withheld.push({
                kind: signal.kind,
                partition: signal.partition,
                reason: "already-pending"
            });
            continue
        }
        if (ctx.force) uu.writeFileSync(pendingPath, signal.pendingBody, "utf8");
        else try {
            uu.writeFileSync(pendingPath, signal.pendingBody, {
                encoding: "utf8",
                flag: "wx"
            })
        } catch (err) {
            if (err?.code !== "EEXIST") throw err;
            result.withheld.push({
                kind: signal.kind,
                partition: signal.partition,
                reason: "already-pending"
            });
            continue
        }
        result.posted.push(pendingPath)
    } catch (err) {
        result.errors.push(`${signal.kind} → ${signal.partition}/${signal.pendingFilename}: ${String(err)}`)
    }
    return result
}
