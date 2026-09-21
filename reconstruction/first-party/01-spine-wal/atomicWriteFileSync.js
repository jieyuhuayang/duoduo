// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicWriteFileSync  (minified: Z9e, daemon.pretty.js:32008)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicWriteFileSync(e, t, n = new Date(t.ts)) {
    await Oe(e.eventsDir);
    let r = wm(n),
        i = sR.join(e.eventsDir, r),
        o = `${qi(t)}
`;
    return H9e(i, async () => {
        let s = await oR.open(i, "a");
        try {
            let u = (await s.stat()).size,
                c = (await s.write(o)).bytesWritten;
            return {
                event: t,
                partition: r,
                byteOffset: u,
                byteLength: c
            }
        } finally {
            await s.close()
        }
    })
}
