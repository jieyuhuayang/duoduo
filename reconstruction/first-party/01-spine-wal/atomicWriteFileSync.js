// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicWriteFileSync  (minified: d2e, daemon.pretty.js:30665)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicWriteFileSync(e, t, n = new Date(t.ts)) {
    await ge(e.eventsDir);
    let r = mk(n),
        i = pk.join(e.eventsDir, r),
        s = `${JSON.stringify(t)}
`;
    return c2e(i, async () => {
        let o = await fk.open(i, "a");
        try {
            let u = (await o.stat()).size,
                l = (await o.write(s)).bytesWritten;
            return {
                event: t,
                partition: r,
                byteOffset: u,
                byteLength: l
            }
        } finally {
            await o.close()
        }
    })
}
