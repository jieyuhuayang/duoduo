// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: countCompactGapIntervals  (minified: Mxe, daemon.pretty.js:72357)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// since: v0.5.10 — first release whose bundle holds this declaration; body changed in no later release (maps/history_daemon.json)
// locals: 15 renamed — 1 from the code at the binding (rule), 14 proposed by an LLM reading the body; descriptive, not evidence (maps/locals_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function countCompactGapIntervals(paths, sessionKey, since) {
    let sinceDate = since ? new Date(since) : void 0,
        records;
    try {
        records = await readDrainRecords(paths, sessionKey, sinceDate)
    } catch (err) {
        return logWarnMessage("[runner] compact_stats: G gap counts unavailable (ledger read failed)", {
            sessionKey,
            error: err instanceof Error ? err.message : String(err)
        }), {}
    }
    let startTimes = records.map(record => new Date(record.drain_started_at).getTime()).filter(ms => Number.isFinite(ms)).sort((a, b) => a - b),
        gapsOverHour = 0,
        gapsFiveMinToHour = 0;
    for (let i = 1; i < startTimes.length; i++) {
        let gapMs = startTimes[i] - startTimes[i - 1];
        gapMs > sht ? gapsOverHour += 1 : gapMs >= aht && (gapsFiveMinToHour += 1)
    }
    return {
        g_gt1h_since_prev_compact: gapsOverHour,
        g_5m1h_since_prev_compact: gapsFiveMinToHour
    }
}
