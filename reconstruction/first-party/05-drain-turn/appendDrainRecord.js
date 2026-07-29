// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: appendDrainRecord  (minified: Pl, daemon.pretty.js:34958)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendDrainRecord(e, t) {
    await _e(e.usageDir);
    let n = drainRecordPath(e, t.session_key),
        r = `${JSON.stringify(t)}
`;
    await Jk.appendFile(n, r, "utf8")
}
