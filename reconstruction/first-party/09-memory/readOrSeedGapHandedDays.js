// duoduo reconstruction — subsystem: 09-memory
// symbol: readOrSeedGapHandedDays  (minified: smt, daemon.pretty.js:69023)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readOrSeedGapHandedDays(memoryDir, varDir, dryRun) {
    let handedPath = Wc.join(varDir, "memory", Rke);
    try {
        return {
            coverage: NS(du.readFileSync(handedPath, "utf8")),
            readFault: !1
        }
    } catch (err) {
        if (!Ike(err)) return recordUnreadableMemoryPath(err), {
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
        coverage: NS(seedText),
        readFault: !1
    };
    du.mkdirSync(Wc.dirname(handedPath), {
        recursive: !0
    });
    try {
        return du.writeFileSync(handedPath, seedText, {
            encoding: "utf8",
            flag: "wx"
        }), {
            coverage: NS(seedText),
            readFault: !1
        }
    } catch (err) {
        if (err?.code !== "EEXIST") throw err;
        return omt(handedPath)
    }
}
