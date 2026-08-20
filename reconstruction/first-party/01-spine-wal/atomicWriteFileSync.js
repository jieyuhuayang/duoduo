// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicWriteFileSync  (minified: Z6e, daemon.pretty.js:31246)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicWriteFileSync(e, t, n = new Date(t.ts)) {
    await xe(e.eventsDir);
    let r = Bx(n),
        i = qx.join(e.eventsDir, r),
        o = `${JSON.stringify(t)}
`;
    return W6e(i, async () => {
        let s = await Ux.open(i, "a");
        try {
            let l = (await s.stat()).size,
                c = (await s.write(o)).bytesWritten;
            return {
                event: t,
                partition: r,
                byteOffset: l,
                byteLength: c
            }
        } finally {
            await s.close()
        }
    })
}
