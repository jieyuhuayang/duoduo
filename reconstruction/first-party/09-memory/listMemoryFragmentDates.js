// duoduo reconstruction — subsystem: 09-memory
// symbol: listMemoryFragmentDates  (minified: Nht, daemon.pretty.js:69850)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.8.0 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 5 renamed — 1 from the code at the binding (rule), 4 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// changelog v0.8.0 (medium): one distils raw experience into fragments
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

function listMemoryFragmentDates(memoryDir) {
    let entries;
    try {
        entries = lu.readdirSync(qc.join(memoryDir, "fragments"), {
            withFileTypes: !0
        })
    } catch (err) {
        return {
            dates: [],
            readFault: recordUnreadableUnlessMissing(err)
        }
    }
    let dates = [];
    for (let entry of entries) entry.isDirectory() && Xg(entry.name) && dates.push(entry.name);
    return {
        dates: dates.sort(),
        readFault: !1
    }
}
