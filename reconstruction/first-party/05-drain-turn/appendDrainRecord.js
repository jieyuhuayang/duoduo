// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: appendDrainRecord  (minified: pf, daemon.pretty.js:37043)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// since: v0.2.0 — first release whose bundle holds this declaration; body changed in v0.8.0 (maps/history_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendDrainRecord(e, t) {
    await ensureDirectoryExists(e.usageDir);
    let n = drainRecordPath(e, t.session_key),
        r = `${stringifyJsonlRecord(t)}
`;
    await SI.appendFile(n, r, "utf8")
}
