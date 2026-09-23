// duoduo reconstruction — subsystem: 01-spine-wal
// symbol: appendEventToPartition  (minified: X9e, daemon.pretty.js:32008)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

async function appendEventToPartition(e, t, n = new Date(t.ts)) {
    await $e(e.eventsDir);
    let r = Sm(n),
        i = sR.join(e.eventsDir, r),
        o = `${Bi(t)}
`;
    return G9e(i, async () => {
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
