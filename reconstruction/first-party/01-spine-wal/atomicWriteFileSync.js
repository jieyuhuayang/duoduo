// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: atomicWriteFileSync  (minified: pJe, daemon.pretty.js:31439)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function atomicWriteFileSync(e, t, n = new Date(t.ts)) {
    await Te(e.eventsDir);
    let r = Op(n),
        i = _E.join(e.eventsDir, r),
        o = `${Si(t)}
`;
    return cJe(i, async () => {
        let s = await yE.open(i, "a");
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
