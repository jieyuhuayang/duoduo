// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: appendDrainRecord  (minified: _d, daemon.pretty.js:36117)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendDrainRecord(e, t) {
    await Te(e.usageDir);
    let n = drainRecordPath(e, t.session_key),
        r = `${Si(t)}
`;
    await n0.appendFile(n, r, "utf8")
}
