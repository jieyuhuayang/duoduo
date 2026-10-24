// duoduo reconstruction — subsystem: 09-memory
// symbol: readOrSeedGapHandedDays  (minified: Lht, daemon.pretty.js:69907)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readOrSeedGapHandedDays(memoryDir, varDir, dryRun) {
    let handedPath = qc.join(varDir, "memory", rxe);
    try {
        return {
            coverage: $S(lu.readFileSync(handedPath, "utf8")),
            readFault: !1
        }
    } catch (err) {
        if (!ixe(err)) return recordUnreadableMemoryPath(err), {
            coverage: new Map,
            readFault: !0
        }
    }
    let memoryFragmentDates = listMemoryFragmentDates(memoryDir);
    if (memoryFragmentDates.readFault) return {
        coverage: new Map,
        readFault: !0
    };
    let seedText = memoryFragmentDates.dates.length > 0 ? `${memoryFragmentDates.dates.join(`
`)}
` : "";
    if (dryRun) return {
        coverage: $S(seedText),
        readFault: !1
    };
    lu.mkdirSync(qc.dirname(handedPath), {
        recursive: !0
    });
    try {
        return lu.writeFileSync(handedPath, seedText, {
            encoding: "utf8",
            flag: "wx"
        }), {
            coverage: $S(seedText),
            readFault: !1
        }
    } catch (err) {
        if (err?.code !== "EEXIST") throw err;
        return jht(handedPath)
    }
}
