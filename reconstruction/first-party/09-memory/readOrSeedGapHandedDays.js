// duoduo reconstruction — subsystem: 09-memory
// symbol: readOrSeedGapHandedDays  (minified: zdt, daemon.pretty.js:67824)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 8 renamed — 3 from the code at the binding (rule), 5 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function readOrSeedGapHandedDays(memoryDir, varDir, dryRun) {
    let handedPath = zc.join(varDir, "memory", uSe);
    try {
        return {
            coverage: _S(au.readFileSync(handedPath, "utf8")),
            readFault: !1
        }
    } catch (err) {
        if (!lSe(err)) return recordUnreadableMemoryPath(err), {
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
        coverage: _S(seedText),
        readFault: !1
    };
    au.mkdirSync(zc.dirname(handedPath), {
        recursive: !0
    });
    try {
        return au.writeFileSync(handedPath, seedText, {
            encoding: "utf8",
            flag: "wx"
        }), {
            coverage: _S(seedText),
            readFault: !1
        }
    } catch (err) {
        if (err?.code !== "EEXIST") throw err;
        return Fdt(handedPath)
    }
}
