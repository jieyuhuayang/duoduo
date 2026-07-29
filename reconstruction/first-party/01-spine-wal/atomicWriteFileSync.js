// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicWriteFileSync  (minified: E2e, daemon.pretty.js:30685)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicWriteFileSync(e, t, n = new Date(t.ts)) {
    await _e(e.eventsDir);
    let r = mk(n),
        i = pk.join(e.eventsDir, r),
        s = `${JSON.stringify(t)}
`;
    return k2e(i, async () => {
        let o = await fk.open(i, "a");
        try {
            let c = (await o.stat()).size,
                l = (await o.write(s)).bytesWritten;
            return {
                event: t,
                partition: r,
                byteOffset: c,
                byteLength: l
            }
        } finally {
            await o.close()
        }
    })
}
