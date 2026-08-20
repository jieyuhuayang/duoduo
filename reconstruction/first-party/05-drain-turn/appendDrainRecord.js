// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: appendDrainRecord  (minified: od, daemon.pretty.js:35913)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendDrainRecord(e, t) {
    await xe(e.usageDir);
    let n = drainRecordPath(e, t.session_key),
        r = `${JSON.stringify(t)}
`;
    await x0.appendFile(n, r, "utf8")
}
