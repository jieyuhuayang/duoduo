// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: appendDrainRecord  (minified: Qd, daemon.pretty.js:36748)
// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendDrainRecord(e, t) {
    await $e(e.usageDir);
    let n = drainRecordPath(e, t.session_key),
        r = `${Bi(t)}
`;
    await BR.appendFile(n, r, "utf8")
}
